#!/usr/bin/env node
/**
 * Apicraft contract-review daemon.
 *
 * Serves every operation in an OpenAPI spec as a review page: the human
 * approves or flags each endpoint (consumer questions, not aesthetics), and
 * the daemon records the verdicts for the agent.
 *
 * Usage:
 *   node review.mjs --spec openapi.yaml --round r1 [--port 8770]
 *   node review.mjs --round r1 --wait [--timeout S]
 *   node review.mjs --round r1 --result
 *
 * State: writes `review-result.json` in the cwd:
 *   { round, verdicts: [{ endpoint, verdict, note? }], at }
 * Exit codes: 0 · 1 no result within timeout · 2 usage error
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { extractOperations } from "./lib/spec-extract.mjs";

const RESULT_FILE = join(process.cwd(), "review-result.json");
const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const has = (flag) => argv.includes(flag);
const round = get("--round");
const port = parseInt(get("--port") || "8770", 10);
const specFile = get("--spec");

function usage(msg) {
  console.error("review: " + msg);
  console.error("usage: node review.mjs --spec <openapi.yaml> --round <name> [--port n] | --round <name> --wait | --round <name> --result");
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
      console.error(`review: no recorded verdicts for round "${round}"`);
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
      console.error(`review: no verdicts recorded for round "${round}" within ${timeout / 1000}s`);
      process.exit(1);
    }
    setTimeout(tick, 250);
  };
  tick();
} else {
  serveMode();
}

function serveMode() {
  if (!specFile) usage("--spec <openapi.yaml> is required in serve mode");
  let specText;
  try {
    specText = readFileSync(resolve(specFile), "utf8");
  } catch (e) {
    usage(`cannot read spec ${specFile}: ${e.message}`);
  }
  const ops = extractOperations(specText);
  const endpoints = Object.keys(ops).map((key) => ({
    endpoint: key,
    operationId: ops[key].operationId || "",
    summary: ops[key].summary || "",
    deprecated: ops[key].deprecated,
  }));

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const page = () => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Apicraft — contract review (${esc(round)})</title>
<style>
  :root { --bg:#101418; --panel:#161c22; --text:#e8eaf0; --muted:#8b93a1; --line:#262e37; --accent:#4d7cfe; --ok:#2f9e6a; --flag:#e5a94f; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.5 system-ui,sans-serif; padding:24px; }
  h1 { font-size:18px; font-weight:650; }
  .sub { color:var(--muted); margin-bottom:18px; }
  .row { background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:10px 14px; margin-bottom:8px; display:flex; align-items:center; gap:12px; }
  .row .ep { font-family:ui-monospace,monospace; font-size:13px; flex:1; }
  .row .meta { color:var(--muted); font-size:11px; }
  .row button { border:0; border-radius:5px; padding:5px 12px; font-size:12px; font-weight:600; cursor:pointer; }
  .approve { background:#16301f; color:var(--ok); }
  .flag { background:#33260f; color:var(--flag); }
  .row.done.approved { border-color:var(--ok); }
  .row.done.flagged { border-color:var(--flag); }
  .status { color:var(--muted); font-size:12px; margin-top:16px; }
  #submit { background:var(--accent); color:#fff; margin-top:12px; }
  #submit:disabled { opacity:0.5; cursor:default; }
</style>
</head>
<body>
  <h1>Contract review — round “${esc(round)}”</h1>
  <div class="sub">Verdict each endpoint from the consumer's seat: does it state its promise? Approve it, or flag it for the agent.</div>
${endpoints.map((e, idx) => `  <div class="row" id="row-${idx}" data-ep="${esc(e.endpoint)}">
    <span class="ep">${esc(e.endpoint)}</span>
    <span class="meta">${esc(e.operationId || "")}${e.deprecated ? " · deprecated" : ""}${e.summary ? " · " + esc(e.summary) : ""}</span>
    <button class="approve" onclick="verdict(${idx}, 'approved')">Approve</button>
    <button class="flag" onclick="verdict(${idx}, 'flagged')">Flag</button>
    <button class="flag" onclick="verdict(${idx}, 'n/a')">N/A</button>
  </div>`).join("\n")}
  <button id="submit" disabled onclick="submitAll()">Record verdicts</button>
  <div class="status" id="status">review every endpoint, then record</div>
<script>
  const verdicts = {};
  function verdict(idx, v) {
    const row = document.getElementById("row-" + idx);
    row.className = "row done " + (v === "approved" ? "approved" : "flagged");
    verdicts[row.dataset.ep] = v;
    const total = ${endpoints.length};
    const done = Object.keys(verdicts).length;
    document.getElementById("submit").disabled = done < total;
    document.getElementById("status").textContent = done + "/" + total + " reviewed";
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
  setInterval(async () => {
    try { await fetch("/beat"); } catch {}
  }, 3000);
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
          const known = new Set(endpoints.map((e) => e.endpoint));
          const valid = {};
          for (const [ep, v] of Object.entries(verdicts)) {
            if (known.has(ep) && (v === "approved" || v === "flagged" || v === "n/a")) valid[ep] = v;
          }
          if (Object.keys(valid).length !== endpoints.length) {
            res.writeHead(400, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "every endpoint needs a verdict" }));
            return;
          }
          const result = {
            round,
            verdicts: Object.entries(valid).map(([endpoint, verdict]) => ({ endpoint, verdict })),
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

    console.error(`review: cannot bind port ${port} — ${e.message} (is another daemon running?)`);

    process.exit(2);

  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`review: round "${round}" · ${endpoints.length} endpoint(s) · http://localhost:${port}`);
    console.log("review: verdict each endpoint; the result lands in review-result.json");
  });
}
