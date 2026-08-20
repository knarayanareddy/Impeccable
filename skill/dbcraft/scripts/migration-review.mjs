#!/usr/bin/env node
/**
 * Dbcraft migration-review daemon.
 *
 * Serves a migration's steps as a review page: the human verdicts each step
 * (Approve / Flag / N/A) against the migration checklist — the review-before-
 * production-data gate, in the browser. The agent writes the steps as JSON
 * (it has already read the migration file); the human owns the verdicts.
 *
 * Usage:
 *   node migration-review.mjs --steps steps.json --round r1 [--port 8775]
 *   node migration-review.mjs --round r1 --wait [--timeout S]
 *   node migration-review.mjs --round r1 --result
 *
 * Steps file shape (JSON):
 *   [ { "name": "001_add_currency", "up": "...", "down": "...",
 *       "reversible": true, "lockImpact": "none", "backfill": "..." } ]
 *
 * State: writes `migration-review-result.json` in the cwd.
 * Exit codes: 0 · 1 no result within timeout · 2 usage error
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const RESULT_FILE = join(process.cwd(), "migration-review-result.json");
const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const has = (flag) => argv.includes(flag);
const round = get("--round");
const port = parseInt(get("--port") || "8775", 10);
const stepsFile = get("--steps");

function usage(msg) {
  console.error("migration-review: " + msg);
  console.error("usage: node migration-review.mjs --steps <steps.json> --round <name> [--port n] | --round <name> --wait | --round <name> --result");
  process.exit(2);
}
if (!round) usage("--round is required");

if (has("--wait") || has("--result")) {
  const timeout = parseInt(get("--timeout") || "600", 10) * 1000;
  const deadline = Date.now() + timeout;
  const readResult = () => {
    if (!existsSync(RESULT_FILE)) return null;
    try {
      const r = JSON.parse(readFileSync(RESULT_FILE, "utf8"));
      return r.round === round ? r : null;
    } catch {
      return null;
    }
  };
  const emit = (r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  };
  if (has("--result")) {
    const r = readResult();
    if (!r) {
      console.error(`migration-review: no recorded verdicts for round "${round}"`);
      process.exit(1);
    }
    emit(r);
  }
  const waitStart = existsSync(RESULT_FILE) ? statSync(RESULT_FILE).mtimeMs : 0;
  const tick = () => {
    const r = readResult();
    if (r) {
      const mtime = statSync(RESULT_FILE).mtimeMs;
      if (mtime > waitStart) emit(r);
    }
    if (Date.now() > deadline) {
      console.error(`migration-review: no verdicts recorded for round "${round}" within ${timeout / 1000}s`);
      process.exit(1);
    }
    setTimeout(tick, 250);
  };
  tick();
} else {
  serveMode();
}

function serveMode() {
  if (!stepsFile) usage("--steps <steps.json> is required in serve mode");
  let steps;
  try {
    steps = JSON.parse(readFileSync(resolve(stepsFile), "utf8"));
  } catch (e) {
    usage(`cannot read steps ${stepsFile}: ${e.message}`);
  }
  if (!Array.isArray(steps) || !steps.length) usage("steps.json must be a non-empty array");
  for (const s of steps) {
    if (!s.name) usage("every step needs a name");
  }

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const page = () => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Dbcraft — migration review (${esc(round)})</title>
<style>
  :root { --bg:#101418; --panel:#161c22; --text:#e8eaf0; --muted:#8b93a1; --line:#262e37; --accent:#4d7cfe; --ok:#2f9e6a; --flag:#e5a94f; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.5 system-ui,sans-serif; padding:24px; }
  h1 { font-size:18px; font-weight:650; }
  .sub { color:var(--muted); margin-bottom:18px; }
  .step { background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:12px 14px; margin-bottom:10px; }
  .step .head { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
  .step .name { font-weight:600; flex:1; }
  .step .facts { color:var(--muted); font-size:11px; font-family:ui-monospace,monospace; }
  .step pre { background:#0b0d10; border-radius:6px; padding:10px; font-size:12px; overflow:auto; margin:6px 0 0; color:#c9d4e3; }
  .step button { border:0; border-radius:5px; padding:4px 12px; font-size:12px; font-weight:600; cursor:pointer; }
  .approve { background:#16301f; color:var(--ok); }
  .flag { background:#33260f; color:var(--flag); }
  .step.done.approved { border-color:var(--ok); }
  .step.done.flagged { border-color:var(--flag); }
  .status { color:var(--muted); font-size:12px; margin-top:16px; }
  #submit { background:var(--accent); color:#fff; margin-top:12px; }
  #submit:disabled { opacity:0.5; cursor:default; }
</style>
</head>
<body>
  <h1>Migration review — round “${esc(round)}”</h1>
  <div class="sub">Verdict each step against the migration checklist: existing rows handled? reversible? non-locking? destructive?</div>
${steps.map((s, idx) => `  <div class="step" id="step-${idx}" data-name="${esc(s.name)}">
    <div class="head">
      <span class="name">${esc(s.name)}</span>
      <span class="facts">reversible: ${s.reversible ? "yes" : "no"} · lock: ${esc(s.lockImpact || "?")}${s.backfill ? " · backfill: yes" : ""}</span>
      <button class="approve" onclick="verdict(${idx}, 'approved')">Approve</button>
      <button class="flag" onclick="verdict(${idx}, 'flagged')">Flag</button>
      <button class="flag" onclick="verdict(${idx}, 'n/a')">N/A</button>
    </div>
    <pre>${esc(s.up || "(no up captured)")}${s.down ? "\n\n-- down --\n" + esc(s.down) : ""}</pre>
  </div>`).join("\n")}
  <button id="submit" disabled onclick="submitAll()">Record verdicts</button>
  <div class="status" id="status">review every step, then record</div>
<script>
  const verdicts = {};
  function verdict(idx, v) {
    const row = document.getElementById("step-" + idx);
    row.className = "step done " + (v === "approved" ? "approved" : "flagged");
    verdicts[row.dataset.name] = v;
    const done = Object.keys(verdicts).length;
    document.getElementById("submit").disabled = done < ${steps.length};
    document.getElementById("status").textContent = done + "/" + ${steps.length} + " reviewed";
  }
  async function submitAll() {
    const res = await fetch("/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ verdicts }),
    });
    document.getElementById("status").textContent = res.ok
      ? "Recorded ✓ — you can close this tab."
      : "Failed to record — is the daemon still running?";
  }
  setInterval(async () => { try { await fetch("/beat"); } catch {} }, 3000);
</script>
</body>
</html>`;

  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(page());
      return;
    }
    if (req.method === "GET" && url.pathname === "/beat") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === "POST" && url.pathname === "/submit") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const { verdicts } = JSON.parse(body);
          const known = new Set(steps.map((s) => s.name));
          const valid = {};
          for (const [name, v] of Object.entries(verdicts)) {
            if (known.has(name) && (v === "approved" || v === "flagged" || v === "n/a")) valid[name] = v;
          }
          if (Object.keys(valid).length !== steps.length) {
            res.writeHead(400, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "every step needs a verdict" }));
            return;
          }
          const result = {
            round,
            verdicts: Object.entries(valid).map(([name, verdict]) => ({ name, verdict })),
            at: new Date().toISOString(),
          };
          writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(result));
        } catch {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "bad payload" }));
        }
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.on("error", (e) => {

    console.error("migration-review: cannot bind port ${port} — ${e.message} (is another daemon running?)");

    process.exit(2);

  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`migration-review: round "${round}" · ${steps.length} step(s) · http://localhost:${port}`);
    console.log("migration-review: verdict each step; the result lands in migration-review-result.json");
  });
}
