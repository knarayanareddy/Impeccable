#!/usr/bin/env node
/**
 * Seccraft threat-review daemon.
 *
 * Serves the threat model's threats (STRIDE entries written by the agent as
 * JSON) as a decision page: the human verdicts each — accept (control holds),
 * mitigate (ticket it), accept-risk (recorded with the owner), escalate.
 * The threatmodel command's daemon mode: the model produces tickets, the
 * page records the decisions.
 *
 * Usage:
 *   node threat-review.mjs --threats threats.json --round r1 [--port 8795]
 *   node threat-review.mjs --round r1 --wait [--timeout S]
 *   node threat-review.mjs --round r1 --result
 *
 * Threats file shape (JSON):
 *   [ { "boundary": "HTTP ingress", "threat": "Tampering: order payload spoofed",
 *       "stride": "T", "likelihood": "high", "impact": "high",
 *       "control": "schema validation" } ]
 *
 * State: writes `threat-review-result.json` in the cwd.
 * Exit codes: 0 · 1 no result within timeout · 2 usage error
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const RESULT_FILE = join(process.cwd(), "threat-review-result.json");
const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const has = (flag) => argv.includes(flag);
const round = get("--round");
const port = parseInt(get("--port") || "8795", 10);
const threatsFile = get("--threats");

function usage(msg) {
  console.error("threat-review: " + msg);
  console.error("usage: node threat-review.mjs --threats <threats.json> --round <name> [--port n] | --round <name> --wait | --round <name> --result");
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
      console.error(`threat-review: no recorded verdicts for round "${round}"`);
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
      console.error(`threat-review: no verdicts recorded for round "${round}" within ${timeout / 1000}s`);
      process.exit(1);
    }
    setTimeout(tick, 250);
  };
  tick();
} else {
  serveMode();
}

function serveMode() {
  if (!threatsFile) usage("--threats <threats.json> is required in serve mode");
  let threats;
  try {
    threats = JSON.parse(readFileSync(resolve(threatsFile), "utf8"));
  } catch (e) {
    usage(`cannot read threats ${threatsFile}: ${e.message}`);
  }
  if (!Array.isArray(threats) || !threats.length) usage("threats.json must be a non-empty array");
  for (const t of threats) {
    if (!t.threat) usage("every threat needs a threat description");
  }

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const page = () => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Seccraft — threat review (${esc(round)})</title>
<style>
  :root { --bg:#101418; --panel:#161c22; --text:#e8eaf0; --muted:#8b93a1; --line:#262e37; --accent:#4d7cfe; --ok:#2f9e6a; --flag:#e5a94f; --risk:#f4606c; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.5 system-ui,sans-serif; padding:24px; }
  h1 { font-size:18px; font-weight:650; }
  .sub { color:var(--muted); margin-bottom:18px; }
  .threat { background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:12px 14px; margin-bottom:10px; }
  .threat .head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .threat .name { font-weight:600; flex:1; }
  .threat .facts { color:var(--muted); font-size:11px; font-family:ui-monospace,monospace; }
  .threat .control { color:var(--muted); font-size:12px; margin-top:4px; }
  .threat button { border:0; border-radius:5px; padding:4px 10px; font-size:11.5px; font-weight:600; cursor:pointer; }
  .accept { background:#16301f; color:var(--ok); }
  .mitigate { background:#33260f; color:var(--flag); }
  .risk { background:#3a1a20; color:var(--risk); }
  .escalate { background:#1d2735; color:#7fb2ff; }
  .threat.done { border-color:var(--ok); }
  .threat.done.flagged { border-color:var(--flag); }
  .threat.done.risky { border-color:var(--risk); }
  .status { color:var(--muted); font-size:12px; margin-top:16px; }
  #submit { background:var(--accent); color:#fff; margin-top:12px; }
  #submit:disabled { opacity:0.5; cursor:default; }
</style>
</head>
<body>
  <h1>Threat review — round “${esc(round)}”</h1>
  <div class="sub">Verdict each threat: the control holds · mitigate (ticket) · accept risk (recorded) · escalate. Gaps must not leave silently.</div>
${threats.map((t, idx) => `  <div class="threat" id="t-${idx}" data-name="${esc(t.threat)}">
    <div class="head">
      <span class="name">${esc(t.threat)}</span>
      <span class="facts">${esc(t.boundary || "")} · ${esc(t.stride || "")} · ${esc(t.likelihood || "?")} × ${esc(t.impact || "?")}</span>
      <button class="accept" onclick="verdict(${idx}, 'accept')">Control holds</button>
      <button class="mitigate" onclick="verdict(${idx}, 'mitigate')">Mitigate</button>
      <button class="risk" onclick="verdict(${idx}, 'accept-risk')">Accept risk</button>
      <button class="escalate" onclick="verdict(${idx}, 'escalate')">Escalate</button>
    </div>
    ${t.control ? `<div class="control">control: ${esc(t.control)}</div>` : `<div class="control" style="color:var(--risk)">no control stated — this is the gap</div>`}
  </div>`).join("\n")}
  <button id="submit" disabled onclick="submitAll()">Record verdicts</button>
  <div class="status" id="status">review every threat, then record</div>
<script>
  const verdicts = {};
  function verdict(idx, v) {
    const row = document.getElementById("t-" + idx);
    row.className = "threat done" + (v === "mitigate" ? " flagged" : v === "accept-risk" ? " risky" : "");
    verdicts[row.dataset.name] = v;
    const done = Object.keys(verdicts).length;
    document.getElementById("submit").disabled = done < ${threats.length};
    document.getElementById("status").textContent = done + "/" + ${threats.length} + " reviewed";
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
          const known = new Set(threats.map((t) => t.threat));
          const valid = {};
          for (const [threat, v] of Object.entries(verdicts)) {
            if (known.has(threat) && ["accept", "mitigate", "accept-risk", "escalate"].includes(v)) valid[threat] = v;
          }
          if (Object.keys(valid).length !== threats.length) {
            res.writeHead(400, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "every threat needs a verdict" }));
            return;
          }
          const result = {
            round,
            verdicts: Object.entries(valid).map(([threat, verdict]) => ({ threat, verdict })),
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
    console.log(`threat-review: round "${round}" · ${threats.length} threat(s) · http://localhost:${port}`);
    console.log("threat-review: verdict each threat; the result lands in threat-review-result.json");
  });
}
