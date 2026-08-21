#!/usr/bin/env node
/**
 * Live-model evals — run the craft skills on real models.
 *
 * The impeccable-style skill-behavior suite: each scenario hands a model a
 * failing file + the skill's fix contract, then the deterministic checker
 * scores the model's output. The model that "fixes" the file must make the
 * checker pass; a reply that returns the input unchanged is recorded and
 * failed (it did no work).
 *
 * Protocol: OpenAI-compatible chat completions (works for OpenAI, OpenRouter,
 * Gemini-compatible, and Anthropic-through-proxy endpoints).
 *
 * Usage:
 *   EVALS_MODEL=gpt-4o-mini EVALS_API_KEY=… node scripts/live-model-evals.mjs
 *   node scripts/live-model-evals.mjs --offline        # fixture model, no network
 *   node scripts/live-model-evals.mjs --fixture garbage|unchanged   # for harness pinning
 *   EVALS_ENDPOINT=… node scripts/live-model-evals.mjs --model m --json
 *
 * Exit codes: 0 all scenarios pass · 1 any scenario fails · 2 usage error
 * Results land in live-model-results/results.json (gitignored).
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const SCENARIOS_FILE = join(ROOT, "tests", "live-model", "scenarios.json");
const RESULTS_DIR = join(ROOT, "live-model-results");
const RESULTS_FILE = join(RESULTS_DIR, "results.json");

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const offline = argv.includes("--offline");
const fixtureArg = get("--fixture"); // garbage | unchanged (harness pinning)
const noNetwork = offline || Boolean(fixtureArg);
const json = argv.includes("--json");
const model = get("--model") || process.env.EVALS_MODEL || "gpt-4o-mini";
const endpoint = process.env.EVALS_ENDPOINT || "https://api.openai.com/v1/chat/completions";
const apiKey = process.env.EVALS_API_KEY || "";
const timeoutMs = (parseInt(get("--timeout") || "120", 10) || 120) * 1000;

if (!noNetwork && !apiKey) {
  console.error("live-model-evals: EVALS_API_KEY is required (or run --offline with the fixture model)");
  process.exit(2);
}

let scenarios;
try {
  scenarios = JSON.parse(readFileSync(SCENARIOS_FILE, "utf8")).scenarios;
} catch (e) {
  console.error(`live-model-evals: cannot read scenarios: ${e.message}`);
  process.exit(2);
}

function buildPrompt(s) {
  let p = `${s.task}\n\nSkill: ${s.skill}\n\nCurrent files:\n`;
  for (const f of s.files) {
    p += `\`\`\`${f.path}\n${f.content}\n\`\`\`\n\n`;
  }
  return p;
}

/** Extract fixed files from the reply: fenced blocks whose language matches a
 * scenario path; falls back to the first fence for single-file scenarios. */
function extractFixes(reply, s) {
  const blocks = [];
  const re = /```([\w./-]*)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(reply))) blocks.push({ path: m[1].trim(), content: m[2].replace(/\n$/, "") + "\n" });
  const fixes = {};
  for (const b of blocks) {
    if (s.files.some((f) => f.path === b.path)) fixes[b.path] = b.content;
  }
  if (!Object.keys(fixes).length && s.files.length === 1 && blocks.length === 1) {
    fixes[s.files[0].path] = blocks[0].content;
  }
  return fixes;
}

async function callModel(prompt, s) {
  if (noNetwork) {
    // Fixture model — deterministic, for offline verification and pinning
    if (fixtureArg === "garbage") return "No fix needed here. Everything looks fine.";
    if (fixtureArg === "unchanged") {
      return s.files.map((f) => `\`\`\`${f.path}\n${f.content}\n\`\`\``).join("\n");
    }
    return Object.entries(s.golden).map(([p, c]) => `\`\`\`${p}\n${c}\n\`\`\``).join("\n");
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a senior engineer executing a deterministic quality gate. Reply only with the fixed file(s) as fenced code blocks; no prose." },
        { role: "user", content: prompt },
      ],
      temperature: 0,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`model endpoint ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("model returned no message content");
  return text;
}

function runChecker(s, dir, fixes) {
  const paths = s.files.map((f) => join(dir, f.path));
  const r = spawnSync(process.execPath, [join(ROOT, s.check.script), ...s.check.args, ...paths], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
  });
  return { exit: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

async function main() {
  const results = [];
  for (const s of scenarios) {
    const dir = join(RESULTS_DIR, ".sandbox", s.id);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    for (const f of s.files) writeFileSync(join(dir, f.path), f.content);
    const t0 = Date.now();
    let entry = { id: s.id, skill: s.skill, model: offline || fixtureArg ? `fixture(${fixtureArg || "golden"})` : model };
    try {
      const reply = await callModel(buildPrompt(s), s);
      const fixes = extractFixes(reply, s);
      const missing = s.files.filter((f) => !(f.path in fixes));
      if (missing.length) {
        entry.verdict = "fail";
        entry.reason = `no fix returned for ${missing.map((f) => f.path).join(", ")}`;
      } else {
        for (const [p, c] of Object.entries(fixes)) writeFileSync(join(dir, p), c);
        // unchanged = same content modulo trailing whitespace (fence artifacts)
        const unchanged = Object.entries(fixes).every(
          ([p, c]) => c.replace(/\s+$/, "") === s.files.find((f) => f.path === p).content.replace(/\s+$/, "")
        );
        const check = runChecker(s, dir, fixes);
        entry.checkerExit = check.exit;
        entry.unchanged = unchanged;
        entry.verdict = check.exit === 0 && !unchanged ? "pass" : "fail";
        if (unchanged) entry.reason = "model returned the input unchanged";
        else if (check.exit !== 0) entry.reason = `checker exit ${check.exit}`;
      }
    } catch (e) {
      entry.verdict = "fail";
      entry.reason = String(e.message || e);
    }
    entry.latencyMs = Date.now() - t0;
    results.push(entry);
    rmSync(dir, { recursive: true, force: true });
  }

  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(RESULTS_FILE, JSON.stringify({ at: new Date().toISOString(), model, offline: offline || Boolean(fixtureArg), results }, null, 2) + "\n");

  const pass = results.filter((r) => r.verdict === "pass").length;
  if (json) {
    console.log(JSON.stringify({ pass, total: results.length, results }, null, 2));
  } else {
    for (const r of results) {
      const mark = r.verdict === "pass" ? "✓" : "✗";
      console.log(`${mark} ${r.id.padEnd(30)} ${r.verdict.padEnd(5)} ${r.reason || `checker ${r.checkerExit}`} (${r.latencyMs}ms)`);
    }
    console.log(`\nlive-model-evals: ${pass}/${results.length} scenarios passed — results in live-model-results/results.json`);
  }
  process.exit(pass === results.length ? 0 : 1);
}

main();
