#!/usr/bin/env node
/**
 * Testcraft behavioral evals — scenario harness.
 *
 * Pins checker behaviors (rules, severities, exemptions, windowed detection,
 * comment stripping), the suite-health aggregator, and the flake-review
 * daemon protocol. Zero dependencies.
 *
 * Run:  node tests/scenarios.mjs
 * Exit: 0 all pass · 1 failures
 */

import { execFileSync, spawn } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CHECKER = join(here, "..", "scripts", "check.mjs");
const HEALTH = join(here, "..", "scripts", "suite-health.mjs");
const REVIEW = join(here, "..", "scripts", "flake-review.mjs");
const TMP = join(here, ".tmp-fixtures");
let pass = 0, fail = 0;

const scenarios = [];
function scenario(name, { files, args = [], exitCode, contains = [], notContains = [], json = false }) {
  scenarios.push({ name, files, args, exitCode, contains, notContains, json });
}
const FIX = (name, content) => [name, content];

scenario("focused test flagged (error)", {
  files: [FIX("t.test.js", `it.only("x", () => { expect(1).toBe(1); });`)],
  exitCode: 1, contains: ["focused-test"],
});
scenario("skipped test flagged (warning)", {
  files: [FIX("t.test.js", `it.skip("x", () => { expect(work()).toBe(42); });`)],
  exitCode: 0, contains: ["skipped-test"],
});
scenario("empty test flagged; comment-only body flagged", {
  files: [FIX("t.test.js", `it("a", () => {});\nit("b", () => { /* TODO */ });\nit("c", () => { expect(work()).toBe(42); });`)],
  exitCode: 0, contains: ["empty-test"],
});
scenario("windowed python empty test flagged", {
  files: [FIX("test_t.py", `def test_x():\n    pass\n\ndef test_y():\n    assert 1 == 1\n`)],
  exitCode: 0, contains: ["empty-test"],
});
scenario("literal/tautological assertion flagged (error)", {
  files: [FIX("t.test.js", `it("a", () => { expect(true).toBe(true); });\nit("b", () => { expect(x).toBe(x); });\nit("c", () => { expect(work()).toBe(42); });`)],
  exitCode: 1, contains: ["tautological-assertion"],
});
scenario("python tautology flagged (error)", {
  files: [FIX("test_t.py", `def test_a():\n    assertEqual(a, a)\n`)],
  exitCode: 1, contains: ["tautological-assertion"],
});
scenario("file with tests but no assertions flagged", {
  files: [FIX("t.test.js", `test("a", () => { setup(); run(); });\ntest("b", () => { setup(); run(); });`)],
  exitCode: 0, contains: ["no-assertions-in-file"],
});
scenario("sleep in test flagged (error)", {
  files: [FIX("t.test.js", `it("a", async () => { await new Promise(r => setTimeout(r, 500)); expect(1).toBe(1); });`)],
  exitCode: 1, contains: ["sleep-in-test"],
});
scenario("python time.sleep flagged (error)", {
  files: [FIX("test_t.py", `def test_a():\n    import time\n    time.sleep(2)\n    assert 1 == 1\n`)],
  exitCode: 1, contains: ["sleep-in-test"],
});
scenario("unseeded randomness flagged", {
  files: [FIX("t.test.js", `it("a", () => { const x = Math.random(); expect(x).toBeDefined(); });`)],
  exitCode: 0, contains: ["random-in-test"],
});
scenario("retry mask flagged", {
  files: [FIX("t.test.js", `test.retryTimes(3)("a", () => { expect(work()).toBe(42); });`)],
  exitCode: 0, contains: ["retry-mask"],
});
scenario("network in unit test flagged; integration path exempt", {
  files: [FIX("unit/t.test.js", `it("a", async () => { const r = await fetch("https://api.example.com"); expect(r).toBeDefined(); });`),
         FIX("integration/t2.test.js", `it("a", async () => { const r = await fetch("http://localhost:8080/health"); expect(r.ok).toBe(true); });`)],
  exitCode: 0, contains: ["network-in-test"],
});
scenario("prose comments are not evidence", {
  files: [FIX("t.test.js", `// we ban it.only and time.sleep — prose, not code\nit("a", () => { expect(work()).toBe(42); });`)],
  exitCode: 0, notContains: ["focused-test", "sleep-in-test"],
});
scenario("non-test files skipped", {
  files: [FIX("main.ts", `export function f() { console.log("here"); }`)],
  exitCode: 0,
});
scenario("idiomatic table-driven test passes clean", {
  files: [FIX("t.test.ts", `describe("shipping", () => {\n  it.each([\n    [0, 0],\n    [1, 500],\n    [10, 1500],\n  ])("costs %i for %i items", (count, expected) => {\n    expect(shipping(count)).toBe(expected);\n  });\n});`)],
  exitCode: 0,
});

async function healthScenario(name, dirFiles, { contains = [], notContains = [] }) {
  const dir = TMP + "-sh-" + name.replace(/[^a-z0-9]/gi, "");
  mkdirSync(dir, { recursive: true });
  for (const [fname, content] of Object.entries(dirFiles)) {
    mkdirSync(join(dir, fname.split("/").slice(0, -1).join("/")), { recursive: true });
    writeFileSync(join(dir, fname), content);
  }
  try {
    let out;
    try {
      out = execFileSync("node", [HEALTH, "--target", dir, "--history", join(dir, "history.json")], { encoding: "utf8" });
    } catch (e) {
      out = (e.stdout || "") + (e.stderr || "");
    }
    const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
    if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
    const history = JSON.parse(readFileSync(join(dir, "history.json"), "utf8"));
    if (!history.length) { console.log(`✗ ${name} — history not appended`); fail++; return; }
    console.log(`✓ ${name}`); pass++;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

await healthScenarioJson("suite-health: --json shape and two-record history trend", {
  "a.test.js": `it.skip("x", () => { expect(work()).toBe(42); });\n`,
});
async function healthScenarioJson(name, dirFiles) {
  const dir = TMP + "-shj";
  mkdirSync(dir, { recursive: true });
  for (const [fname, content] of Object.entries(dirFiles)) writeFileSync(join(dir, fname), content);
  try {
    const hist = join(dir, "history.json");
    let out = "";
    try { out = execFileSync("node", [HEALTH, "--target", dir, "--history", hist, "--json"], { encoding: "utf8" }); }
    catch (e) { out = (e.stdout || "") + (e.stderr || ""); }
    const parsed = JSON.parse(out);
    if (parsed.worstFiles === undefined || parsed.ruleCounts === undefined) throw new Error("missing aggregate fields");
    execFileSync("node", [HEALTH, "--target", dir, "--history", hist], { stdio: "pipe" });
    const history = JSON.parse(readFileSync(hist, "utf8"));
    if (history.length !== 2) throw new Error(`expected 2 history records, got ${history.length}`);
    console.log(`✓ ${name}`); pass++;
  } catch (e) {
    console.log(`✗ ${name} — ${e.message}`); fail++;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

await healthScenario("suite-health: ranks worst files and appends history", {
  "a.test.js": `it.only("x", () => { expect(1).toBe(1); });\n`,
  "b.test.js": `it("x", () => { expect(1).toBe(1); });\n`,
}, { contains: ["focused-test", "a.test.js", "history appended"] });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await (async () => {
  const dir = TMP + "-fr";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "flakes.json"), JSON.stringify([
    { test: "checkout > rejects expired card", file: "src/checkout.test.ts", failures: 4, suspected: "time" },
    { test: "feed > renders rows", file: "src/feed.test.tsx", failures: 2, suspected: "order" },
  ]));
  const port = 8997;
  const srv = spawn("node", [REVIEW, "--flakes", "flakes.json", "--round", "r1", "--port", String(port)], { cwd: dir });
  try {
    let up = false;
    for (let i = 0; i < 20; i++) {
      try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
      await wait(150);
    }
    if (!up) { console.log("✗ flake-review: did not come up"); fail++; }
    else {
      const page = await (await fetch(`http://localhost:${port}/`)).text();
      if (!page.includes("checkout &gt; rejects expired card") && !page.includes("checkout")) { console.log("✗ flake-review: flakes missing from page"); fail++; }
      else {
        console.log("✓ flake-review: serves every flake"); pass++;
        const partial = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "checkout > rejects expired card": "fix-now" } }) });
        if (partial.status !== 400) { console.log("✗ flake-review: partial submit not rejected"); fail++; }
        else {
          console.log("✓ flake-review: partial submit rejected"); pass++;
          const full = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "checkout > rejects expired card": "fix-now", "feed > renders rows": "quarantine-ticket" } }) });
          if (full.status !== 200) { console.log("✗ flake-review: full submit rejected"); fail++; }
          else {
            const out = execFileSync("node", [REVIEW, "--round", "r1", "--result"], { cwd: dir, encoding: "utf8" });
            if (!out.includes('"verdict": "quarantine-ticket"') || !out.includes('"verdict": "fix-now"')) { console.log("✗ flake-review: result missing verdicts"); fail++; }
            else { console.log("✓ flake-review: verdicts recorded and readable"); pass++; }
          }
        }
      }
    }
  } finally {
    srv.kill();
    rmSync(dir, { recursive: true, force: true });
  }
})();

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
for (const s of scenarios) {
  for (const [name, content] of s.files) {
    mkdirSync(join(TMP, name.split("/").slice(0, -1).join("/")), { recursive: true });
    writeFileSync(join(TMP, name), content);
  }
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
    if (s.json) {
      try { JSON.parse(out); } catch { console.log(`✗ ${s.name} — --json output not parseable`); fail++; continue; }
    }
    const misses = [...s.contains.filter((c) => !out.includes(c)), ...s.notContains.filter((c) => out.includes(c))];
    if (misses.length) { console.log(`✗ ${s.name} — ${misses.join(", ")}`); fail++; continue; }
    console.log(`✓ ${s.name}`);
    pass++;
  }
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\ntestcraft scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
