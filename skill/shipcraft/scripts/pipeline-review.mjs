#!/usr/bin/env node
/**
 * Shipcraft pipeline-review daemon.
 *
 * Serves the deploy pipeline's steps as a decision page: the human verdicts
 * each step — ship / flag / n-a — against the recovery and risk contracts.
 * The daemon mode of the `review` + `deploy` commands: flagged steps become
 * the worklist, and the Friday question ("would you ship from this pipeline
 * at 4:55 p.m.?") gets an auditable answer.
 *
 * Usage:
 *   node pipeline-review.mjs --steps steps.json --round r1 [--port 8797]
 *   node pipeline-review.mjs --round r1 --wait [--timeout S]
 *   node pipeline-review.mjs --round r1 --result
 *
 * Steps file shape (JSON) — agent-written step inventory:
 *   [ { "name": "deploy-prod", "job": "deploy", "run": "./deploy.sh",
 *       "risk": "high", "rollback": "./rollback.sh --previous-image",
 *       "approval": "env prod requires maintainer review" },
 *     { "name": "load-test", "job": "verify", "risk": "low" } ]
 *
 * Red gap callouts: a step with no `rollback` reference shows "gap: no
 * rollback reference"; a `risk: high` step with no `approval` reference
 * shows "gap: high-risk without approval reference".
 *
 * State: writes `pipeline-review-result.json` in the cwd.
 * Exit codes: 0 · 1 no result within timeout · 2 usage error
 * Bind note: serves on 0.0.0.0 — run only on a trusted network.
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const RESULT_FILE = join(process.cwd(), "pipeline-review-result.json");
const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const has = (flag) => argv.includes(flag);
const round = get("--round");
const port = parseInt(get("--port") || "8797", 10);
const stepsFile = get("--steps");

function usage(msg) {
  console.error("pipeline-review: " + msg);
  console.error("usage: node pipeline-review.mjs --steps <steps.json> --round <name> [--port n] | --round <name> --wait | --round <name> --result");
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
      console.error(`pipeline-review: no recorded verdicts for round "${round}"`);
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
      console.error(`pipeline-review: no verdicts recorded for round "${round}" within ${timeout / 1000}s`);
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
  let entries;
  try {
    entries = JSON.parse(readFileSync(resolve(stepsFile), "utf8"));
  } catch (e) {
    usage(`cannot read steps ${stepsFile}: ${e.message}`);
  }
  if (!Array.isArray(entries) || !entries.length) usage("steps.json must be a non-empty array");
  const seen = new Set();
  for (const e of entries) {
    if (!e.name) usage("every step needs a name");
    if (seen.has(e.name)) usage(`step names must be unique — "${e.name}" appears twice (submission could never complete)`);
    seen.add(e.name);
    if (e.risk !== undefined && !["low", "medium", "high"].includes(String(e.risk).toLowerCase())) {
      usage(`step "${e.name}" has risk "${e.risk}" — expected low|medium|high`);
    }
  }

  const gapsOf = (e) => {
    const gaps = [];
    if (!e.rollback) gaps.push("no rollback reference");
    if (String(e.risk).toLowerCase() === "high" && !e.approval) gaps.push("high-risk without approval reference");
    return gaps;
  };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const page = () => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Shipcraft — pipeline review (${esc(round)})</title>
<style>
  :root { --bg:#101418; --panel:#161c22; --text:#e8eaf0; --muted:#8b93a1; --line:#262e37; --accent:#4d7cfe; --ok:#2f9e6a; --flag:#e5a94f; --risk:#f4606c; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.5 system-ui,sans-serif; padding:24px; }
  h1 { font-size:18px; font-weight:650; }
  .sub { color:var(--muted); margin-bottom:18px; }
  .entry { background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:12px 14px; margin-bottom:10px; }
  .entry .head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .entry .name { font-weight:600; flex:1; }
  .entry .job { font-size:10px; padding:1px 6px; border-radius:4px; text-transform:uppercase; letter-spacing:0.04em; background:#1d2735; color:#7fb2ff; }
  .entry .risk { font-size:10px; padding:1px 6px; border-radius:4px; text-transform:uppercase; letter-spacing:0.04em; }
  .risk.low { background:#16301f; color:var(--ok); }
  .risk.medium { background:#33260f; color:var(--flag); }
  .risk.high { background:#3a1620; color:var(--risk); }
  .entry .run { color:var(--muted); font-size:12px; font-family:ui-monospace,monospace; margin-top:4px; }
  .entry .gap { color:var(--risk); font-size:12px; margin-top:4px; }
  .entry button { border:0; border-radius:5px; padding:4px 10px; font-size:11.5px; font-weight:600; cursor:pointer; }
  .ship { background:#16301f; color:var(--ok); }
  .flag { background:#33260f; color:var(--flag); }
  .na { background:#1d2735; color:#7fb2ff; }
  .entry.done { border-color:var(--ok); }
  .entry.done.flagged { border-color:var(--flag); }
  .status { color:var(--muted); font-size:12px; margin-top:16px; }
  #submit { background:var(--accent); color:#fff; margin-top:12px; }
  #submit:disabled { opacity:0.5; cursor:default; }
</style>
</head>
<body>
  <h1>Pipeline review — round “${esc(round)}”</h1>
  <div class="sub">Verdict each deploy step: ship it, flag it, or n/a. Steps missing their rollback (or a high-risk step missing its approval reference) are called out in red.</div>
${entries.map((e, idx) => {
    const gaps = gapsOf(e);
    return `  <div class="entry" id="e-${idx}" data-name="${esc(e.name)}">
    <div class="head">
      ${e.job ? `<span class="job">${esc(e.job)}</span>` : ""}
      <span class="name">${esc(e.name)}</span>
      ${e.risk ? `<span class="risk ${esc(String(e.risk).toLowerCase())}">${esc(e.risk)}</span>` : ""}
      <button class="ship" onclick="verdict(${idx}, 'ship')">Ship</button>
      <button class="flag" onclick="verdict(${idx}, 'flag')">Flag</button>
      <button class="na" onclick="verdict(${idx}, 'n/a')">N/A</button>
    </div>
    ${e.run ? `<div class="run">${esc(e.run)}</div>` : ""}
    ${e.rollback ? `<div class="run">rollback: ${esc(e.rollback)}</div>` : ""}
    ${e.approval ? `<div class="run">approval: ${esc(e.approval)}</div>` : ""}
    ${gaps.length ? `<div class="gap">gap: ${esc(gaps.join("; "))}</div>` : ""}
  </div>`;
  }).join("\n")}
  <button id="submit" disabled onclick="submitAll()">Record verdicts</button>
  <div class="status" id="status">review every step, then record</div>
<script>
  const verdicts = {};
  function verdict(idx, v) {
    const row = document.getElementById("e-" + idx);
    row.className = "entry done" + (v === "flag" ? " flagged" : "");
    verdicts[row.dataset.name] = v;
    const done = Object.keys(verdicts).length;
    document.getElementById("submit").disabled = done < ${entries.length};
    document.getElementById("status").textContent = done + "/" + ${entries.length} + " reviewed";
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
          const known = new Set(entries.map((e) => e.name));
          const valid = {};
          for (const [name, v] of Object.entries(verdicts)) {
            if (known.has(name) && ["ship", "flag", "n/a"].includes(v)) valid[name] = v;
          }
          if (Object.keys(valid).length !== entries.length) {
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
    console.error(`pipeline-review: cannot bind port ${port} — ${e.message} (is another daemon running?)`);
    process.exit(2);
  });
  server.listen(port, "0.0.0.0", () => {
    console.log(`pipeline-review: round "${round}" · ${entries.length} step${entries.length === 1 ? "" : "s"} · http://localhost:${port} (trusted network only)`);
    console.log("pipeline-review: verdict each step; the result lands in pipeline-review-result.json");
  });
}
