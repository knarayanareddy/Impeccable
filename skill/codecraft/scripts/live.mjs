#!/usr/bin/env node
/**
 * Codecraft live-mode daemon — refactor variant mode.
 *
 * Serves a decision page showing candidate refactors side by side and records the
 * user's pick. The agent-side protocol: generate options → serve → `--wait` →
 * apply. Zero dependencies, no build step. (The code-facet adaptation of the
 * decision-page pattern; each skill ships its own copy for standalone installs.)
 *
 * Usage:
 *   node live.mjs --round <name> --port <n> --options a.json [b.json ...]
 *   node live.mjs --round <name> --wait [--timeout S]
 *   node live.mjs --round <name> --result
 *
 * Option file shape (JSON):
 *   { "name": "A — guard clauses", "rationale": "depth 5 → 2, behavior preserved",
 *     "code": "function ship(order) {\n  if (!order) return;\n  ...\n}" }
 *
 * State: writes `live-result.json` in the cwd. Exit codes: 0 · 1 timeout.
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const RESULT_FILE = join(process.cwd(), "live-result.json");

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const has = (flag) => argv.includes(flag);

const round = get("--round");
const port = parseInt(get("--port") || "8765", 10);
const optionFiles = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--options") {
    for (let j = i + 1; j < argv.length && !argv[j].startsWith("--"); j++) optionFiles.push(argv[j]);
    break;
  }
}

function usage(msg) {
  console.error("live: " + msg);
  console.error("usage: node live.mjs --round <name> [--port <n>] --options <file.json>... | --wait | --result");
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
      console.error(`live: no recorded choice for round "${round}"`);
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
      console.error(`live: no choice recorded for round "${round}" within ${timeout / 1000}s`);
      process.exit(1);
    }
    setTimeout(tick, 250);
  };
  tick();
} else {
  serveMode();
}

function serveMode() {
  const options = optionFiles.map((f) => {
    try {
      return JSON.parse(readFileSync(resolve(f), "utf8"));
    } catch (e) {
      usage(`cannot read option file ${f}: ${e.message}`);
    }
  });
  if (!options.length) usage("--options <file.json>... is required in serve mode");
  for (const o of options) {
    if (!o.name) usage("every option needs a name");
  }

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const page = () => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Codecraft — choose a refactor (${esc(round)})</title>
<style>
  :root { --bg:#101418; --panel:#161c22; --text:#e8eaf0; --muted:#8b93a1; --line:#262e37; --accent:#4d7cfe; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.5 system-ui,sans-serif; padding:24px; }
  h1 { font-size:18px; font-weight:650; }
  .sub { color:var(--muted); margin-bottom:18px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:14px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:14px; cursor:pointer; transition:border-color 150ms ease-out; }
  .card:hover { border-color:var(--accent); }
  .card.chosen { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent); }
  .card h2 { font-size:14px; margin:0 0 4px; }
  .why { color:var(--muted); font-size:12px; margin-bottom:10px; }
  .preview pre { background:#0b0d10; border:1px solid var(--line); border-radius:6px; padding:12px; overflow:auto; max-height:220px; font-size:12px; line-height:1.45; color:#c9d4e3; margin:0; }
  .status { color:var(--muted); font-size:12px; margin-top:16px; }
</style>
</head>
<body>
  <h1>Choose a refactor — round “${esc(round)}”</h1>
  <div class="sub">Both variants preserve behavior; pick the one that reads best. The choice is recorded for the agent.</div>
  <div class="cards">
${options.map((o) => `    <div class="card" data-name="${esc(o.name)}">
      <h2>${esc(o.name)}</h2>
      <div class="why">${esc(o.rationale || "")}</div>
      <div class="preview"><pre>${esc(o.code || "")}</pre></div>
    </div>`).join("\n")}
  </div>
  <div class="status" id="status">waiting for a choice</div>
<script>
  let heartbeat = 0;
  setInterval(async () => {
    try { await fetch("/beat"); heartbeat = 0; }
    catch { heartbeat++; if (heartbeat > 20) document.getElementById("status").textContent = "daemon connection lost — reload"; }
  }, 3000);
  for (const card of document.querySelectorAll(".card")) {
    card.addEventListener("click", async () => {
      document.querySelectorAll(".card").forEach((c) => c.classList.remove("chosen"));
      card.classList.add("chosen");
      const res = await fetch("/choose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ option: card.dataset.name }),
      });
      document.getElementById("status").textContent = res.ok
        ? "Recorded ✓ — “" + card.dataset.name + "”. You can close this tab."
        : "Failed to record — is the daemon still running?";
    });
  }
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
    if (req.method === "POST" && url.pathname === "/choose") {
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
          const { option } = JSON.parse(body);
          if (!options.some((o) => o.name === option)) {
            res.writeHead(400, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "unknown option" }));
            return;
          }
          const result = { round, chosen: option, at: new Date().toISOString(), options: options.map((o) => o.name) };
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

    console.error(`live: cannot bind port ${port} — ${e.message} (is another daemon running?)`);

    process.exit(2);

  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`live: round "${round}" · ${options.length} option(s) · http://localhost:${port}`);
    console.log("live: open the URL, pick a refactor; the choice lands in live-result.json");
  });
}
