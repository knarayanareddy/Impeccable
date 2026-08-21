#!/usr/bin/env node
/**
 * Obscraft slo-review daemon.
 *
 * Serves the SLO and alert definitions as a decision page: the human
 * verdicts each — approve / flag / n-a — against the actionability and
 * SLI-quality contracts. The daemon mode of the slo + alert commands:
 * flagged entries become the worklist.
 *
 * Usage:
 *   node slo-review.mjs --review review.json --round r1 [--port 8796]
 *   node slo-review.mjs --round r1 --wait [--timeout S]
 *   node slo-review.mjs --round r1 --result
 *
 * Review file shape (JSON):
 *   [ { "kind": "slo", "name": "checkout-availability",
 *       "facts": "99.9% complete < 3s over 30d", "owner": "payments-team" },
 *     { "kind": "alert", "name": "CheckoutFastBurn",
 *       "facts": "burn rate 2%/1h", "owner": "payments-team",
 *       "runbook": "runbooks/checkout-burn.md" } ]
 *
 * State: writes `slo-review-result.json` in the cwd.
 * Exit codes: 0 · 1 no result within timeout · 2 usage error
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const RESULT_FILE = join(process.cwd(), "slo-review-result.json");
const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const has = (flag) => argv.includes(flag);
const round = get("--round");
const port = parseInt(get("--port") || "8796", 10);
const reviewFile = get("--review");

function usage(msg) {
  console.error("slo-review: " + msg);
  console.error("usage: node slo-review.mjs --review <review.json> --round <name> [--port n] | --round <name> --wait | --round <name> --result");
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
      console.error(`slo-review: no recorded verdicts for round "${round}"`);
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
      console.error(`slo-review: no verdicts recorded for round "${round}" within ${timeout / 1000}s`);
      process.exit(1);
    }
    setTimeout(tick, 250);
  };
  tick();
} else {
  serveMode();
}

function serveMode() {
  if (!reviewFile) usage("--review <review.json> is required in serve mode");
  let entries;
  try {
    entries = JSON.parse(readFileSync(resolve(reviewFile), "utf8"));
  } catch (e) {
    usage(`cannot read review ${reviewFile}: ${e.message}`);
  }
  if (!Array.isArray(entries) || !entries.length) usage("review.json must be a non-empty array");
  for (const e of entries) {
    if (!e.name) usage("every entry needs a name");
    if (!e.kind || !["slo", "alert"].includes(e.kind)) usage(`entry "${e.name}" needs kind slo|alert`);
  }

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const page = () => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Obscraft — SLO/alert review (${esc(round)})</title>
<style>
  :root { --bg:#101418; --panel:#161c22; --text:#e8eaf0; --muted:#8b93a1; --line:#262e37; --accent:#4d7cfe; --ok:#2f9e6a; --flag:#e5a94f; --risk:#f4606c; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.5 system-ui,sans-serif; padding:24px; }
  h1 { font-size:18px; font-weight:650; }
  .sub { color:var(--muted); margin-bottom:18px; }
  .entry { background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:12px 14px; margin-bottom:10px; }
  .entry .head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .entry .name { font-weight:600; flex:1; }
  .entry .kind { font-size:10px; padding:1px 6px; border-radius:4px; text-transform:uppercase; letter-spacing:0.04em; background:#1d2735; color:#7fb2ff; }
  .entry .facts { color:var(--muted); font-size:12px; font-family:ui-monospace,monospace; margin-top:4px; }
  .entry .gap { color:var(--risk); font-size:12px; margin-top:4px; }
  .entry button { border:0; border-radius:5px; padding:4px 10px; font-size:11.5px; font-weight:600; cursor:pointer; }
  .approve { background:#16301f; color:var(--ok); }
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
  <h1>SLO / alert review — round “${esc(round)}”</h1>
  <div class="sub">Verdict each definition against its contract: the SLO's quartet, the alert's actionability. Gaps are shown in red.</div>
${entries.map((e, idx) => {
    const gaps = [];
    if (e.kind === "slo") {
      if (!e.owner) gaps.push("no owner");
    } else {
      if (!e.owner) gaps.push("no owner");
      if (!e.runbook) gaps.push("no runbook");
    }
    return `  <div class="entry" id="e-${idx}" data-name="${esc(e.name)}">
    <div class="head">
      <span class="kind">${e.kind}</span>
      <span class="name">${esc(e.name)}</span>
      <button class="approve" onclick="verdict(${idx}, 'approve')">Approve</button>
      <button class="flag" onclick="verdict(${idx}, 'flag')">Flag</button>
      <button class="na" onclick="verdict(${idx}, 'n/a')">N/A</button>
    </div>
    ${e.facts ? `<div class="facts">${esc(e.facts)}</div>` : ""}
    ${gaps.length ? `<div class="gap">gap: ${esc(gaps.join(", "))}</div>` : ""}
  </div>`;
  }).join("\n")}
  <button id="submit" disabled onclick="submitAll()">Record verdicts</button>
  <div class="status" id="status">review every entry, then record</div>
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
            if (known.has(name) && ["approve", "flag", "n/a"].includes(v)) valid[name] = v;
          }
          if (Object.keys(valid).length !== entries.length) {
            res.writeHead(400, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "every entry needs a verdict" }));
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
    console.error(`slo-review: cannot bind port ${port} — ${e.message} (is another daemon running?)`);
    process.exit(2);
  });
  server.listen(port, "0.0.0.0", () => {
    console.log(`slo-review: round "${round}" · ${entries.length} entr${entries.length === 1 ? "y" : "ies"} · http://localhost:${port}`);
    console.log("slo-review: verdict each entry; the result lands in slo-review-result.json");
  });
}
