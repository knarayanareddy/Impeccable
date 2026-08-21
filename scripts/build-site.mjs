#!/usr/bin/env node
/**
 * Build-site — generates the evidence pages for the docs site:
 *
 *   docs/benchmark.html   from benchmark/results/*.json (the public-repo runs)
 *   docs/evals.html       the live-model eval harness status + how to run it
 *
 * Deterministic, zero dependencies: any static host can serve docs/ as-is,
 * and `node scripts/site.mjs` serves it locally. Re-run after every
 * benchmark: `node scripts/benchmark.mjs && node scripts/build-site.mjs`.
 *
 * Usage: node scripts/build-site.mjs
 * Exit:  0 · 1 missing benchmark results (run the benchmark first)
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RESULTS_DIR = join(ROOT, "benchmark", "results");
const DOCS = join(ROOT, "docs");

const SKILLS = ["criterion", "codecraft", "apicraft", "dbcraft", "testcraft", "perfcraft", "seccraft", "obscraft", "shipcraft", "bugcraft"];
const SKILL_LABEL = { criterion: "criterion", codecraft: "codecraft", apicraft: "apicraft", dbcraft: "dbcraft", testcraft: "testcraft", perfcraft: "perfcraft", seccraft: "seccraft", obscraft: "obscraft", shipcraft: "shipcraft", bugcraft: "bugcraft" };

function shell() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
  :root { --bg:#101418; --panel:#161c22; --text:#e8eaf0; --muted:#8b93a1; --line:#262e37; --accent:#4d7cfe; --ok:#2f9e6a; --flag:#e5a94f; --risk:#f4606c; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:15px/1.6 system-ui,-apple-system,sans-serif; }
  main { max-width: 960px; margin: 0 auto; padding: 48px 24px 72px; }
  h1 { font-size: 28px; letter-spacing:-0.02em; margin:0 0 8px; }
  .lede { color:var(--muted); margin:0 0 32px; }
  h2 { font-size:19px; margin:36px 0 10px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--line); }
  th { color:var(--muted); font-weight:600; }
  td.num { font-variant-numeric: tabular-nums; text-align:right; }
  .err { color:var(--risk); } .warn { color:var(--flag); }
  code, pre { font-family:ui-monospace,monospace; }
  pre { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:14px 16px; overflow-x:auto; font-size:13px; }
  a { color:var(--accent); }
  .back { color:var(--muted); text-decoration:none; font-size:13px; }
</style>
</head>
<body>
<main>
  <a class="back" href="./">← the craft-skill suite</a>
  <h1>__H1__</h1>
  <p class="lede">__LEDE__</p>
__BODY__
</main>
</body>
</html>`;
}

function loadResults() {
  return readdirSync(RESULTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(RESULTS_DIR, f), "utf8")))
    .sort((a, b) => a.repo.localeCompare(b.repo));
}

function buildBenchmark(results) {
  const rows = results.map((r) => {
    const cells = SKILLS.map((s) => {
      const f = r.facets.find((x) => x.skill === s);
      if (!f) return `<td>—</td>`;
      if (f.n_a) return `<td>n/a</td>`;
      if (f.errors === null) return `<td>err${f.exit}</td>`;
      const cls = f.errors > 0 ? "err" : "";
      return `<td class="num ${cls}">${f.errors}<span class="warn">/w${f.warnings}</span></td>`;
    }).join("");
    return `<tr><td><a href="https://github.com/${r.repo}">${r.repo}</a><br><span style="color:var(--muted);font-size:11px"><code>${r.commit.slice(0, 8)}</code> · ${r.runAt.slice(0, 10)}</span></td>${cells}</tr>`;
  }).join("\n");
  const head = `<tr><th>Repository</th>${SKILLS.map((s) => `<th title="${s}">${s.slice(0, 4)}</th>`).join("")}</tr>`;
  const totals = {};
  for (const r of results) {
    for (const f of r.facets) {
      if (f.errors === null) continue;
      totals[f.skill] = (totals[f.skill] || 0) + f.errors;
    }
  }
  const body = shell()
    .replace("__TITLE__", "Benchmark — checker runs on public repositories")
    .replace("__H1__", "The benchmark")
    .replace("__LEDE__", "All ten facet checkers, run with --strict --json against six public repositories at their recorded commits. Cells are errors/warnings; n/a = no files of that facet. Errors are the signal; heuristic warnings are the documented worklist.")
    .replace("__BODY__", `
  <table>${head}
${rows}
  </table>
  <h2>Reading the results</h2>
  <p>Errors are deterministic bans (debug markers, swallowed exceptions, masks, secret echoes…).
  Some warning classes are deliberately heuristic and fire on mature code
  (<code>magic-number</code>, <code>legacy-var</code>, URL mentions under <code>insecure-transport</code>);
  that over-approximation is documented per rule in each skill's anti-patterns reference, and it
  is why warnings never fail a run without <code>--strict</code>. The errors column is the signal;
  the warnings column is the worklist.</p>
  <h2>Reproduce it</h2>
  <pre>node scripts/benchmark.mjs --refresh   # re-clone the six repos and re-run all 60 checker invocations
node scripts/build-site.mjs           # regenerate this page</pre>
  <p>Full per-rule findings: <code>benchmark/results/*.json</code>.</p>`);
  writeFileSync(join(DOCS, "benchmark.html"), body);
}

function buildEvals() {
  const body = shell()
    .replace("__TITLE__", "Live-model evals — the skills on real models")
    .replace("__H1__", "Live-model evals")
    .replace("__LEDE__", "The impeccable-style skill-behavior suite: a model gets a failing file + the skill's fix contract; the deterministic checker scores the model's output. The harness is pinned offline (4/4 with the fixture model); the real-model run is one command once an API key is in the environment.")
    .replace("__BODY__", `
  <h2>Run it</h2>
  <pre>EVALS_MODEL=gpt-4o-mini EVALS_API_KEY=… node scripts/live-model-evals.mjs
# any OpenAI-compatible endpoint (OpenRouter, Gemini-compatible, Anthropic via proxy):
EVALS_ENDPOINT=https://openrouter.ai/api/v1/chat/completions node scripts/live-model-evals.mjs --model deepseek/deepseek-chat
node scripts/live-model-evals.mjs --offline    # fixture model, no network — the harness self-test</pre>
  <h2>The scenarios</h2>
  <table>
    <tr><th>Scenario</th><th>Skill</th><th>The fix contract</th></tr>
    <tr><td>bugcraft-swallowed-exception</td><td>bugcraft</td><td>the catch block swallows the error — translate or propagate, never delete evidence</td></tr>
    <tr><td>bugcraft-debug-marker</td><td>bugcraft</td><td>shipped print-debugging — remove the marker</td></tr>
    <tr><td>shipcraft-masked-failure</td><td>shipcraft</td><td>a masked CI step — the build must fail for real</td></tr>
    <tr><td>testcraft-focused-test</td><td>testcraft</td><td>a focused test — remove the focus so the whole file runs</td></tr>
  </table>
  <h2>The scoring</h2>
  <p>A scenario passes only when the model's output makes the skill's checker exit 0. A reply that
  returns the input unchanged is recorded and failed (it did no work); garbage output fails; the
  checker is the judge, never prose. Results land in <code>live-model-results/results.json</code>
  with per-scenario latency.</p>
  <h2>The honesty contract</h2>
  <p>The 4-scenario offline run is pinned in the suite-tools harness (38 scenarios). A real-model
  run is evidence, not a score: publish the model name, the date, and the full results file —
  the harness writes all three.</p>`);
  writeFileSync(join(DOCS, "evals.html"), body);
}

if (!existsSync(RESULTS_DIR) || !readdirSync(RESULTS_DIR).some((f) => f.endsWith(".json"))) {
  console.error("build-site: no benchmark results — run `node scripts/benchmark.mjs --clone` then `node scripts/benchmark.mjs` first");
  process.exit(1);
}
buildBenchmark(loadResults());
buildEvals();
console.log("build-site: docs/benchmark.html + docs/evals.html generated");
