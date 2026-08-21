#!/usr/bin/env node
/**
 * Testcraft flake-review daemon.
 *
 * Serves the flakiest tests (from CI retry history, written by the agent as
 * JSON) as a decision page: the human verdicts each — fix now, quarantine
 * with a ticket, known-external, or n/a. The recorded verdicts become the
 * worklist for the flaky command. Same decision-page protocol as the other
 * daemons; the verdicts map to domains/determinism.md's taxonomy.
 *
 * Usage:
 *   node flake-review.mjs --flakes flakes.json --round r1 [--port 8780]
 *   node flake-review.mjs --round r1 --wait [--timeout S]
 *   node flake-review.mjs --round r1 --result
 *
 * Flakes file shape (JSON):
 *   [ { "test": "checkout > rejects expired card", "file": "src/checkout.test.ts",
 *       "failures": 4, "lastRun": "2026-08-20T09:12:00Z", "suspected": "time" } ]
 *
 * State: writes `flake-review-result.json` in the cwd.
 * Exit codes: 0 · 1 no result within timeout · 2 usage error
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const RESULT_FILE = join(process.cwd(), "flake-review-result.json");
const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const has = (flag) => argv.includes(flag);
const round = get("--round");
const port = parseInt(get("--port") || "8780", 10);
const flakesFile = get("--flakes");

function usage(msg) {
  console.error("flake-review: " + msg);
  console.error("usage: node flake-review.mjs --flakes <flakes.json> --round <name> [--port n] | --round <name> --wait | --round <name> --result");
  process.exit(2);
}
if (!round) usage("--round is required");
if (!Number.isInteger(port) || port < 1 || port > 65535) usage("--port must be an integer 1-65535");

if (has("--wait") || has("--result")) {
  const timeout = parseInt(get("--timeout") || "600", 10) * 1000;
  if (!Number.isFinite(timeout) || timeout <= 0) usage("--timeout must be a positive number of seconds");
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
      console.error(`flake-review: no recorded verdicts for round "${round}"`);
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
      console.error(`flake-review: no verdicts recorded for round "${round}" within ${timeout / 1000}s`);
      process.exit(1);
    }
    setTimeout(tick, 250);
  };
  tick();
} else {
  serveMode();
}

function serveMode() {
  if (!flakesFile) usage("--flakes <flakes.json> is required in serve mode");
  let flakes;
  try {
    flakes = JSON.parse(readFileSync(resolve(flakesFile), "utf8"));
  } catch (e) {
    usage(`cannot read flakes ${flakesFile}: ${e.message}`);
  }
  if (!Array.isArray(flakes) || !flakes.length) usage("flakes.json must be a non-empty array");
  for (const f of flakes) {
    if (!f.test) usage("every flake needs a test name");
  }

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const page = () => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Testcraft — flake review (${esc(round)})</title>
<style>
  :root { --bg:#101418; --panel:#161c22; --text:#e8eaf0; --muted:#8b93a1; --line:#262e37; --accent:#4d7cfe; --ok:#2f9e6a; --flag:#e5a94f; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.5 system-ui,sans-serif; padding:24px; }
  h1 { font-size:18px; font-weight:650; }
  .sub { color:var(--muted); margin-bottom:18px; }
  .flake { background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:12px 14px; margin-bottom:10px; }
  .flake .head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .flake .name { font-weight:600; flex:1; }
  .flake .facts { color:var(--muted); font-size:11px; font-family:ui-monospace,monospace; }
  .flake button { border:0; border-radius:5px; padding:4px 10px; font-size:11.5px; font-weight:600; cursor:pointer; }
  .fix { background:#16301f; color:var(--ok); }
  .quarantine { background:#33260f; color:var(--flag); }
  .external { background:#1d2735; color:#7fb2ff; }
  .flake.done { border-color:var(--ok); }
  .flake.done.flagged { border-color:var(--flag); }
  .status { color:var(--muted); font-size:12px; margin-top:16px; }
  #submit { background:var(--accent); color:#fff; margin-top:12px; }
  #submit:disabled { opacity:0.5; cursor:default; }
</style>
</head>
<body>
  <h1>Flake review — round “${esc(round)}”</h1>
  <div class="sub">Verdict each flake: fix now · quarantine + ticket · known external · n/a. Retry-masking is not on the menu.</div>
${flakes.map((f, idx) => `  <div class="flake" id="flake-${idx}" data-name="${esc(f.test)}">
    <div class="head">
      <span class="name">${esc(f.test)}</span>
      <span class="facts">${esc(f.file || "")} · ${f.failures ?? "?"} failures${f.lastRun ? " · last " + esc(f.lastRun) : ""}${f.suspected ? " · suspected: " + esc(f.suspected) : ""}</span>
      <button class="fix" onclick="verdict(${idx}, 'fix-now')">Fix now</button>
      <button class="quarantine" onclick="verdict(${idx}, 'quarantine-ticket')">Quarantine + ticket</button>
      <button class="external" onclick="verdict(${idx}, 'known-external')">Known external</button>
      <button class="quarantine" onclick="verdict(${idx}, 'cannot-reproduce')">Cannot reproduce</button>
      <button class="external" onclick="verdict(${idx}, 'n/a')">N/A</button>
    </div>
  </div>`).join("\n")}
  <button id="submit" disabled onclick="submitAll()">Record verdicts</button>
  <div class="status" id="status">review every flake, then record</div>
<script>
  const verdicts = {};
  function verdict(idx, v) {
    const row = document.getElementById("flake-" + idx);
    row.className = "flake done" + (v === "quarantine-ticket" ? " flagged" : "");
    verdicts[row.dataset.name] = v;
    const done = Object.keys(verdicts).length;
    document.getElementById("submit").disabled = done < ${flakes.length};
    document.getElementById("status").textContent = done + "/" + ${flakes.length} + " reviewed";
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
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
        "cache-control": "no-store",
      });
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
      let tooBig = false;
      req.on("data", (c) => {
        if (tooBig) return;
        body += c;
        if (body.length > 65536) {
          tooBig = true;
          res.writeHead(413, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "payload too large" }));
          req.destroy();
        }
      });
      req.on("end", () => {
        if (tooBig) return;
        try {
          const { verdicts } = JSON.parse(body);
          const known = new Set(flakes.map((f) => f.test));
          const valid = {};
          for (const [test, v] of Object.entries(verdicts)) {
            if (known.has(test) && ["fix-now", "quarantine-ticket", "known-external", "cannot-reproduce", "n/a"].includes(v)) valid[test] = v;
          }
          if (Object.keys(valid).length !== flakes.length) {
            res.writeHead(400, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "every flake needs a verdict" }));
            return;
          }
          const result = {
            round,
            verdicts: Object.entries(valid).map(([test, verdict]) => ({ test, verdict })),
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

    console.error(`flake-review: cannot bind port ${port} — ${e.message} (is another daemon running?)`);

    process.exit(2);

  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`flake-review: round "${round}" · ${flakes.length} flake(s) · http://localhost:${port}`);
    console.log("flake-review: verdict each flake; the result lands in flake-review-result.json");
  });
}
