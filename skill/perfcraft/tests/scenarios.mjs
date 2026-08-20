#!/usr/bin/env node
/**
 * Perfcraft behavioral evals — scenario harness.
 *
 * Pins checker behaviors (rules, severities, exemptions, windowed detection,
 * comment stripping), the budget-check gate, and the optimize-review daemon
 * protocol. Zero dependencies.
 *
 * Run:  node tests/scenarios.mjs
 * Exit: 0 all pass · 1 failures
 */

import { execFileSync, spawn } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CHECKER = join(here, "..", "scripts", "check.mjs");
const BUDGET = join(here, "..", "scripts", "budget-check.mjs");
const REVIEW = join(here, "..", "scripts", "optimize-review.mjs");
const TMP = join(here, ".tmp-fixtures");
let pass = 0, fail = 0;

const scenarios = [];
function scenario(name, { files, args = [], exitCode, contains = [], notContains = [] }) {
  scenarios.push({ name, files, args, exitCode, contains, notContains });
}
const FIX = (name, content) => [name, content];

// ---- checker: I/O & blocking ----
scenario("sync-io flagged (error) incl. readSync/execFileSync", {
  files: [FIX("t.js", `const fs = require("fs");\nfs.readFileSync("/etc/x");\nfs.readSync(fd, b, 0, n, 0);\nrequire("child_process").execFileSync("ls");`)],
  exitCode: 1, contains: ["sync-io"],
});
scenario("async I/O clean", {
  files: [FIX("t.js", `await fs.promises.readFile("/etc/x");`)],
  exitCode: 0, notContains: ["sync-io"],
});
scenario("busy retry loop flagged (error)", {
  files: [FIX("t.js", `while (true) { await fetch("https://api.example.com/status"); }`)],
  exitCode: 1, contains: ["busy-retry"],
});
scenario("backoff retry clean", {
  files: [FIX("t.js", `while (true) { const r = await fetch("https://api.example.com/status"); if (r.ok) break; await sleep(backoff()); }`)],
  exitCode: 0, notContains: ["busy-retry"],
});

// ---- checker: queries & data ----
scenario("n+1 flagged with 5-line lookback; batched clean", {
  files: [FIX("t.js", `for (const id of ids) {\n  const a = validate(id);\n  const b = normalize(a);\n  const c = enrich(b);\n  const z = await db.query("SELECT * FROM t WHERE id = ?", [id]);\n}\nconst rows = await db.query("SELECT id FROM t WHERE id IN (?)", [ids]);`)],
  exitCode: 0, contains: ["n-plus-one"],
});
scenario("select-star flagged; projected clean", {
  files: [FIX("t.js", `db.query("SELECT * FROM t");\ndb.query("SELECT id FROM t");`)],
  exitCode: 0, contains: ["select-star"],
});
scenario("unbounded load flagged; bounded clean", {
  files: [FIX("t.js", `const all = db.find();\nconst page = db.find({ where: { status: "open" }, take: 50 });`)],
  exitCode: 0, contains: ["unbounded-load"],
});

// ---- checker: DOM & memory ----
scenario("layout thrash flagged with lookback; batched clean", {
  files: [FIX("t.js", `for (const el of items) {\n  const h = el.getBoundingClientRect().height;\n}\nconst rects = items.map((el) => el.getBoundingClientRect());`)],
  exitCode: 0, contains: ["layout-thrash"],
});
scenario("innerHTML += flagged", {
  files: [FIX("t.js", `el.innerHTML += "<li>" + x + "</li>";`)],
  exitCode: 0, contains: ["dom-thrash"],
});
scenario("deep clone in loop flagged", {
  files: [FIX("t.js", `const copies = orders.map((o) => JSON.parse(JSON.stringify(o)));`)],
  exitCode: 0, contains: ["deep-clone"],
});
scenario("string concat in loop flagged (both forms)", {
  files: [FIX("t.js", `let html = "";\nfor (const r of rows) {\n  html += r.name;\n  html = html + r.id;\n}`)],
  exitCode: 0, contains: ["string-concat-loop"],
});

// ---- checker: delivery ----
scenario("img without lazy flagged; with it clean", {
  files: [FIX("t.html", `<img src="a.png" />\n<img src="b.png" loading="lazy" width="10" height="10" />`)],
  exitCode: 0, contains: ["img-no-lazy"],
});

// ---- checker: comment stripping ----
scenario("bounded retry loop with backoff is clean (not N+1, not string-concat)", {
  files: [FIX("t.js", `async function retryStatus() {
  let attempt = 0;
  while (attempt < 3) {
    const res = await fetch("https://api.example.com/status");
    if (res.ok) return res;
    attempt += 1;
    await sleep(100 * 2 ** attempt);
  }
  throw new Error("unreachable");
}`)],
  exitCode: 0, notContains: ["n-plus-one", "string-concat-loop"],
});
scenario("data-iteration loops still flag N+1", {
  files: [FIX("t.js", `for (const id of ids) {
  const row = await db.query("SELECT * FROM t WHERE id = ?", [id]);
}`)],
  exitCode: 0, contains: ["n-plus-one"],
});
scenario("prose comments are not evidence", {
  files: [FIX("t.js", `// this handler once used fs.readFileSync and SELECT * FROM users — prose\nasync function f() { return await db.query("SELECT id FROM t"); }`)],
  exitCode: 0, notContains: ["sync-io", "select-star"],
});

// ---- checker: clean pass + project scope ----
scenario("idiomatic code passes clean (budget file silences the gate finding)", {
  files: [FIX("t.ts", `import { db } from "./db";\nconst ORDER_COLUMNS = "id, status" as const;\nexport async function listOrders(ids: string[], opts?: { limit?: number }) {\n  const limit = Math.min(opts?.limit ?? 50, 100);\n  const orders = await db.query(\`SELECT \${ORDER_COLUMNS} FROM orders WHERE id IN (?) LIMIT ?\`, [ids, limit]);\n  return { items: orders, has_more: orders.length === limit };\n}`),
         FIX("budget.json", `{ "budgets": [{ "resource": "js", "size": 200 }] }`)],
  exitCode: 0,
});
scenario("no-budget-gate: project scope only (single file exempt)", {
  files: [FIX("t.js", `async function f() { return await fetch("https://api.example.com"); }`)],
  exitCode: 0, notContains: ["no-budget-gate"],
});

// ---- budget-check scenarios ----
async function budgetScenario(name, budget, measurements, { exitCode, contains = [], notContains = [] }) {
  const dir = TMP + "-bc-" + name.replace(/[^a-z0-9]/gi, "");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "budget.json"), JSON.stringify(budget));
  writeFileSync(join(dir, "m.json"), JSON.stringify(measurements));
  try {
    try {
      const out = execFileSync("node", [BUDGET, "--budget", join(dir, "budget.json"), "--measurements", join(dir, "m.json")], { encoding: "utf8" });
      if (exitCode !== 0) { console.log(`✗ ${name} — expected exit ${exitCode}, got 0`); fail++; return; }
      const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
      if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
      console.log(`✓ ${name}`); pass++;
    } catch (e) {
      const out = (e.stdout || "") + (e.stderr || "");
      if (e.status !== exitCode) { console.log(`✗ ${name} — expected exit ${exitCode}, got ${e.status}`); fail++; return; }
      const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
      if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
      console.log(`✓ ${name}`); pass++;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const BUDGET_SHAPE = {
  resourceSizes: [{ resourceType: "script", budget: 200 }, { resourceType: "total", budget: 1200 }],
  resourceCounts: [{ resourceType: "third-party", budget: 10 }],
  metrics: { LCP: { budgetMs: 2500, percentile: "p75" }, CLS: { budget: 0.1, percentile: "p75" } },
};

await budgetScenario("budget-check: breaches flagged with the numbers", BUDGET_SHAPE,
  { resourceSizes: { script: 300, total: 950 }, resourceCounts: { "third-party": 12 }, metrics: { LCP: 2600, CLS: 0.08 } },
  { exitCode: 1, contains: ["script: 300KB > budget 200KB", "third-party: 12 > budget 10", "LCP: 2600 > budget 2500ms"] });

await budgetScenario("budget-check: within budget passes", BUDGET_SHAPE,
  { resourceSizes: { script: 180, total: 950 }, resourceCounts: { "third-party": 8 }, metrics: { LCP: 2400, CLS: 0.08 } },
  { exitCode: 0, notContains: ["BREACH", "SHAPE"] });

await budgetScenario("budget-check: unmeasured entries are visible, all-unmeasured fails the shape",
  BUDGET_SHAPE, { resourceSizes: { unrelated: 50 }, metrics: {} },
  { exitCode: 1, contains: ["nothing-measured", "unmeasured"] });

await budgetScenario("budget-check: partially-unmeasured entries are reported, verdict holds",
  BUDGET_SHAPE, { resourceSizes: { script: 180 }, resourceCounts: {}, metrics: { LCP: 2400 } },
  { exitCode: 0, contains: ["unmeasured"] });

await budgetScenarioShape("budget-check: wrong-shape budget exits 2 with a clear message",
  { resourceSizes: { script: 200 } }, { resourceSizes: { script: 180 } },
  "budget.resourceSizes must be an array");

await budgetScenarioShape("budget-check: non-object measurements exits 2",
  BUDGET_SHAPE, [1, 2, 3], "the measurements file must be an object");

async function budgetScenarioShape(name, budget, measurements, expected) {
  const dir = TMP + "-bcs";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "budget.json"), JSON.stringify(budget));
  writeFileSync(join(dir, "m.json"), JSON.stringify(measurements));
  try {
    try {
      execFileSync("node", [BUDGET, "--budget", join(dir, "budget.json"), "--measurements", join(dir, "m.json")], { stdio: "pipe" });
      console.log(`✗ ${name} — expected exit 2`); fail++;
    } catch (e) {
      const out = (e.stderr || "") + (e.stdout || "");
      if (e.status === 2 && out.includes(expected)) { console.log(`✓ ${name}`); pass++; }
      else { console.log(`✗ ${name} — exit ${e.status}, message missing: ${expected}`); fail++; }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

await budgetScenario("budget-check: percentile-less metric fails the shape", 
  { metrics: { LCP: { budgetMs: 2500 } } },
  { metrics: { LCP: 2400 } },
  { exitCode: 1, contains: ["metric-without-percentile", "a budget without a percentile is a wish"] });

// ---- optimize-review daemon protocol ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await (async () => {
  const dir = TMP + "-or";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "options.json"), JSON.stringify([
    { name: "batch the cart queries", rationale: "N+1 → 1", before: { p95: "480ms", tool: "trace" }, after: { p95: "210ms" }, complexity: "one batched query" },
    { name: "cache the config", rationale: "cold-path memoization", before: { hits: "0%" }, after: { hits: "94%" }, complexity: "bounded LRU" },
  ]));
  const port = 8999;
  const srv = spawn("node", [REVIEW, "--options", "options.json", "--round", "r1", "--port", String(port)], { cwd: dir });
  try {
    let up = false;
    for (let i = 0; i < 20; i++) {
      try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
      await wait(150);
    }
    if (!up) { console.log("✗ optimize-review: did not come up"); fail++; }
    else {
      const page = await (await fetch(`http://localhost:${port}/`)).text();
      if (!page.includes("batch the cart queries") || !page.includes("480ms")) { console.log("✗ optimize-review: options/numbers missing from page"); fail++; }
      else {
        console.log("✓ optimize-review: serves options with their receipts"); pass++;
        const partial = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "batch the cart queries": "ship" } }) });
        if (partial.status !== 400) { console.log("✗ optimize-review: partial submit not rejected"); fail++; }
        else {
          console.log("✓ optimize-review: partial submit rejected"); pass++;
          const full = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "batch the cart queries": "ship", "cache the config": "revert" } }) });
          if (full.status !== 200) { console.log("✗ optimize-review: full submit rejected"); fail++; }
          else {
            const out = execFileSync("node", [REVIEW, "--round", "r1", "--result"], { cwd: dir, encoding: "utf8" });
            if (!out.includes('"verdict": "ship"') || !out.includes('"verdict": "revert"')) { console.log("✗ optimize-review: result missing verdicts"); fail++; }
            else { console.log("✓ optimize-review: verdicts recorded and readable"); pass++; }
          }
        }
      }
    }
  } finally {
    srv.kill();
    rmSync(dir, { recursive: true, force: true });
  }

  // the floor's gate, enforced at load: no number, no option
  const dir2 = TMP + "-or2";
  mkdirSync(dir2, { recursive: true });
  writeFileSync(join(dir2, "options.json"), JSON.stringify([{ name: "vibes only", rationale: "trust me" }]));
  const srv2 = spawn("node", [REVIEW, "--options", "options.json", "--round", "r2", "--port", "8998"], { cwd: dir2 });
  try {
    await wait(800);
    const exited = srv2.exitCode !== null;
    if (!exited || srv2.exitCode !== 2) { console.log(`✗ optimize-review: number-less option not rejected (exit ${srv2.exitCode})`); fail++; }
    else { console.log("✓ optimize-review: number-less option rejected at load (perf-floor #1)"); pass++; }
  } finally {
    srv2.kill();
    rmSync(dir2, { recursive: true, force: true });
  }
})();

// ---- runner (file scenarios) ----
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
for (const s of scenarios) {
  for (const [name, content] of s.files) writeFileSync(join(TMP, name), content);
  const files = s.files.map(([name]) => join(TMP, name));
  try {
    const out = execFileSync("node", [CHECKER, ...s.args, ...files], { encoding: "utf8" });
    if (s.exitCode !== 0) { console.log(`✗ ${s.name} — expected exit ${s.exitCode}, got 0`); fail++; continue; }
    const misses = [...s.contains.filter((c) => !out.includes(c)), ...s.notContains.filter((c) => out.includes(c))];
    if (misses.length) { console.log(`✗ ${s.name} — ${misses.join(", ")}`); fail++; continue; }
    console.log(`✓ ${s.name}`);
    pass++;
  } catch (e) {
    const out = (e.stdout || "") + (e.stderr || "");
    if (e.status !== s.exitCode) { console.log(`✗ ${s.name} — expected exit ${s.exitCode}, got ${e.status}`); fail++; continue; }
    const misses = [...s.contains.filter((c) => !out.includes(c)), ...s.notContains.filter((c) => out.includes(c))];
    if (misses.length) { console.log(`✗ ${s.name} — ${misses.join(", ")}`); fail++; continue; }
    console.log(`✓ ${s.name}`);
    pass++;
  }
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\nperfcraft scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
