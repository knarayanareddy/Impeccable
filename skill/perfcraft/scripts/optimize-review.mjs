#!/usr/bin/env node
/**
 * Perfcraft optimization-review daemon.
 *
 * Serves candidate optimizations as a decision page: each option carries
 * its measured before/after numbers — the receipt the perf floor demands —
 * and the human verdicts ship / revert / profile-again. No number, no
 * option: options without before/after are rejected at load.
 *
 * Usage:
 *   node optimize-review.mjs --options options.json --round r1 [--port 8790]
 *   node optimize-review.mjs --round r1 --wait [--timeout S]
 *   node optimize-review.mjs --round r1 --result
 *
 * Options file shape (JSON):
 *   [ { "name": "batch the cart queries", "rationale": "N+1 → 1",
 *       "before": { "p95": "480ms", "tool": "trace" },
 *       "after": { "p95": "210ms" },
 *       "complexity": "one batched query" } ]
 *
 * State: writes `optimize-review-result.json` in the cwd.
 * Exit codes: 0 · 1 no result within timeout · 2 usage error
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const RESULT_FILE = join(process.cwd(), "optimize-review-result.json");
const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const has = (flag) => argv.includes(flag);
const round = get("--round");
const port = parseInt(get("--port") || "8790", 10);
const optionsFile = get("--options");

function usage(msg) {
  console.error("optimize-review: " + msg);
  console.error("usage: node optimize-review.mjs --options <options.json> --round <name> [--port n] | --round <name> --wait | --round <name> --result");
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
      console.error(`optimize-review: no recorded verdicts for round "${round}"`);
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
      console.error(`optimize-review: no verdicts recorded for round "${round}" within ${timeout / 1000}s`);
      process.exit(1);
    }
    setTimeout(tick, 250);
  };
  tick();
} else {
  serveMode();
}

function serveMode() {
  if (!optionsFile) usage("--options <options.json> is required in serve mode");
  let options;
  try {
    options = JSON.parse(readFileSync(resolve(optionsFile), "utf8"));
  } catch (e) {
    usage(`cannot read options ${optionsFile}: ${e.message}`);
  }
  if (!Array.isArray(options) || !options.length) usage("options.json must be a non-empty array");
  for (const o of options) {
    if (!o.name) usage("every option needs a name");
    // The perf floor's gate, enforced by the tool: no number, no option.
    if (!o.before || !o.after) {
      usage(`option "${o.name}" lacks before/after measurements — a bet, not an optimization (perf-floor #1)`);
    }
  }

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const page = () => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Perfcraft — optimization review (${esc(round)})</title>
<style>
  :root { --bg:#101418; --panel:#161c22; --text:#e8eaf0; --muted:#8b93a1; --line:#262e37; --accent:#4d7cfe; --ok:#2f9e6a; --flag:#e5a94f; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.5 system-ui,sans-serif; padding:24px; }
  h1 { font-size:18px; font-weight:650; }
  .sub { color:var(--muted); margin-bottom:18px; }
  .opt { background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:12px 14px; margin-bottom:10px; }
  .opt .head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .opt .name { font-weight:600; flex:1; }
  .opt .why { color:var(--muted); font-size:12px; }
  .opt .nums { display:flex; gap:16px; margin-top:6px; font-family:ui-monospace,monospace; font-size:12px; }
  .opt .nums .before { color:var(--flag); }
  .opt .nums .after { color:var(--ok); }
  .opt .complexity { color:var(--muted); font-size:11px; margin-top:4px; }
  .opt button { border:0; border-radius:5px; padding:4px 10px; font-size:11.5px; font-weight:600; cursor:pointer; }
  .ship { background:#16301f; color:var(--ok); }
  .revert { background:#33260f; color:var(--flag); }
  .reprofile { background:#1d2735; color:#7fb2ff; }
  .opt.done.shipped { border-color:var(--ok); }
  .opt.done.flagged { border-color:var(--flag); }
  .status { color:var(--muted); font-size:12px; margin-top:16px; }
  #submit { background:var(--accent); color:#fff; margin-top:12px; }
  #submit:disabled { opacity:0.5; cursor:default; }
</style>
</head>
<body>
  <h1>Optimization review — round “${esc(round)}”</h1>
  <div class="sub">Verdict each candidate on its receipt: ship it · revert it · profile again. The numbers are the evidence.</div>
${options.map((o, idx) => `  <div class="opt" id="opt-${idx}" data-name="${esc(o.name)}">
    <div class="head">
      <span class="name">${esc(o.name)}</span>
      <button class="ship" onclick="verdict(${idx}, 'ship')">Ship</button>
      <button class="revert" onclick="verdict(${idx}, 'revert')">Revert</button>
      <button class="reprofile" onclick="verdict(${idx}, 'profile-again')">Profile again</button>
    </div>
    <div class="why">${esc(o.rationale || "")}</div>
    <div class="nums">
      <span class="before">before: ${esc(Object.entries(o.before).map(([k, v]) => k + " " + v).join(" · "))}</span>
      <span class="after">after: ${esc(Object.entries(o.after).map(([k, v]) => k + " " + v).join(" · "))}</span>
    </div>
    ${o.complexity ? `<div class="complexity">complexity added: ${esc(o.complexity)}</div>` : ""}
  </div>`).join("\n")}
  <button id="submit" disabled onclick="submitAll()">Record verdicts</button>
  <div class="status" id="status">review every candidate, then record</div>
<script>
  const verdicts = {};
  function verdict(idx, v) {
    const row = document.getElementById("opt-" + idx);
    row.className = "opt done" + (v === "ship" ? " shipped" : " flagged");
    verdicts[row.dataset.name] = v;
    const done = Object.keys(verdicts).length;
    document.getElementById("submit").disabled = done < ${options.length};
    document.getElementById("status").textContent = done + "/" + ${options.length} + " reviewed";
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
          const known = new Set(options.map((o) => o.name));
          const valid = {};
          for (const [name, v] of Object.entries(verdicts)) {
            if (known.has(name) && ["ship", "revert", "profile-again"].includes(v)) valid[name] = v;
          }
          if (Object.keys(valid).length !== options.length) {
            res.writeHead(400, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "every option needs a verdict" }));
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

  server.listen(port, "0.0.0.0", () => {
    console.log(`optimize-review: round "${round}" · ${options.length} option(s) · http://localhost:${port}`);
    console.log("optimize-review: verdict each candidate; the result lands in optimize-review-result.json");
  });
}
