#!/usr/bin/env node
/**
 * Bugcraft behavioral evals — scenario harness.
 *
 * Pins checker behaviors (rules, severities, comment stripping with
 * comment-evidence exceptions, --strict/--json), the repro-check bug-record
 * gate (quartet, rung, closure contract, honesty refusals), and the
 * bug-review daemon protocol (verdicts, gap callouts, escaping,
 * port-collision behavior). Zero dependencies.
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
const RCHECK = join(here, "..", "scripts", "repro-check.mjs");
const REVIEW = join(here, "..", "scripts", "bug-review.mjs");
const TMP = join(here, ".tmp-fixtures");
let pass = 0, fail = 0;

const scenarios = [];
function scenario(name, { files, args = [], exitCode, contains = [], notContains = [], json = false }) {
  scenarios.push({ name, files, args, exitCode, contains, notContains, json });
}
const FIX = (name, content) => [name, content];

// ---- checker: rules ----
scenario("debug-marker: console.log(\"here\") family flagged (error)", {
  files: [FIX("t.js", `console.log("here");\nconsole.debug("xxx");\n`), FIX("t.py", `print("HERE")\n`)],
  exitCode: 1, contains: ["debug-marker"],
});
scenario("debug-marker: debugger; statement flagged", {
  files: [FIX("t.js", `function f() { debugger; }\n`)],
  exitCode: 1, contains: ["debug-marker"],
});
scenario("log-and-swallow: single-line catch flagged (error)", {
  files: [FIX("t.js", `try { x(); } catch (e) { console.log(e); }\n`)],
  exitCode: 1, contains: ["log-and-swallow"],
});
scenario("log-and-swallow: multi-line JS catch flagged", {
  files: [FIX("t.js", `try {\n  x();\n} catch (e) {\n  console.log(e);\n}\n`)],
  exitCode: 1, contains: ["log-and-swallow"],
});
scenario("log-and-swallow: python except: print(e) flagged", {
  files: [FIX("t.py", `try:\n  x()\nexcept Exception:\n  print(e)\n`)],
  exitCode: 1, contains: ["log-and-swallow"],
});
scenario("log-and-swallow: handled error passes (rethrow/translate)", {
  files: [FIX("t.js", `try { x(); } catch (e) { throw new Error("op failed", { cause: e }); }\n`)],
  exitCode: 0, notContains: ["log-and-swallow", "swallowed-exception", "silent-catch-return"],
});
scenario("swallowed-exception: catch {} and except: pass flagged (error)", {
  files: [FIX("t.js", `try { x(); } catch (e) {}\n`), FIX("t.py", `try:\n  x()\nexcept:\n  pass\n`)],
  exitCode: 1, contains: ["swallowed-exception"],
});
scenario("silent-catch-return: catch { return null } flagged (warning)", {
  files: [FIX("t.js", `try { x(); } catch (e) { return null; }\n`)],
  exitCode: 0, contains: ["silent-catch-return"],
});
scenario("silent-catch-return: python except: return None flagged", {
  files: [FIX("t.py", `try:\n  x()\nexcept Exception:\n  return None\n`)],
  exitCode: 0, contains: ["silent-catch-return"],
});
scenario("disabled-code: if (false) flagged; if (true) with debug comment flagged", {
  files: [FIX("t.js", `if (false) { legacy(); }\nif (true) { /* debug */ expensive(); }\n`)],
  exitCode: 0, contains: ["disabled-code"],
});
scenario("disabled-code: feature flags (if (ENABLED)) pass", {
  files: [FIX("t.js", `if (ENABLED) { run(); }\n`)],
  exitCode: 0, notContains: ["disabled-code"],
});
scenario("commented-out-debug: commented console.log flagged", {
  files: [FIX("t.js", `// console.log("here");\n`)],
  exitCode: 0, contains: ["commented-out-debug"],
});
scenario("uncertainty-marker: hack without owner flagged; owner passes", {
  files: [FIX("t.js", `// hack: this makes it work\n// TODO(ticket #31): fix the retry\n`)],
  exitCode: 0, contains: ["uncertainty-marker"],
});
scenario("clean idiomatic code passes", {
  files: [FIX("t.js", `export function divide(a, b) {\n  if (b === 0) throw new RangeError("divide: divisor is 0");\n  return a / b;\n}\n`)],
  exitCode: 0, contains: ["clean"],
});

// ---- checker: comment stripping (comments are prose; comment rules are the exception) ----
scenario("prose comments are not evidence (markers/swallows in comments)", {
  files: [FIX("t.js", `// console.log("here") lives in the docs\n// try { x(); } catch (e) {} is what we banned\nconst ok = 1;\n`)],
  exitCode: 0, notContains: ["debug-marker", "log-and-swallow", "swallowed-exception", "silent-catch-return", "disabled-code"],
});
scenario("multi-line block comments are not evidence", {
  files: [FIX("t.js", `/*\nconsole.log("here");\ntry { x(); } catch (e) {}\n*/\nconst ok = 1;\n`)],
  exitCode: 0, notContains: ["debug-marker", "swallowed-exception"],
});
scenario("commented-out disabled block stays prose (not disabled-code)", {
  files: [FIX("t.js", `// if (false) { legacy(); }  — documentation only\nconst ok = 1;\n`)],
  exitCode: 0, notContains: ["disabled-code"],
});
scenario("python hash prose comments are not evidence", {
  files: [FIX("t.py", `# the retry logic lives here\n# banned elsewhere: swallow-then-move-on\nx = 1\n`)],
  exitCode: 0, notContains: ["debug-marker", "swallowed-exception", "commented-out-debug"],
});
scenario("python commented-out print IS the rule's evidence", {
  files: [FIX("t.py", `# print("HERE") — left in the crime scene\nx = 1\n`)],
  exitCode: 0, contains: ["commented-out-debug"],
});
scenario("string content is not a comment start", {
  files: [FIX("t.js", `const url = "https://api.example.com/x";\nconst ok = 1;\n`)],
  exitCode: 0, notContains: ["uncertainty-marker"],
});

// ---- checker: severity semantics and machine output ----
scenario("warnings pass without --strict", {
  files: [FIX("t.js", `if (false) { legacy(); }\n`)],
  exitCode: 0, contains: ["disabled-code"],
});
scenario("warnings fail with --strict", {
  files: [FIX("t.js", `if (false) { legacy(); }\n`)],
  args: ["--strict"], exitCode: 1, contains: ["disabled-code"],
});
scenario("--json output is machine-readable", {
  files: [FIX("t.js", `console.log("here");\n`)],
  args: ["--json"], exitCode: 1, contains: [`"rule": "debug-marker"`], json: true,
});

// ---- repro-check scenarios ----
async function rcScenario(name, fileContent, { exitCode, contains = [], notContains = [], json = false }) {
  const dir = TMP + "-rc-" + name.replace(/[^a-z0-9]/gi, "");
  mkdirSync(dir, { recursive: true });
  const fname = "bugs.yaml";
  writeFileSync(join(dir, fname), fileContent);
  try {
    try {
      const out = execFileSync("node", [RCHECK, "--bugs", join(dir, fname)], { encoding: "utf8" });
      if (exitCode !== 0) { console.log(`✗ ${name} — expected exit ${exitCode}, got 0`); fail++; return; }
      const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
      if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
      console.log(`✓ ${name}`); pass++;
    } catch (e) {
      const out = (e.stdout || "") + (e.stderr || "");
      if (e.status !== exitCode) { console.log(`✗ ${name} — expected exit ${exitCode}, got ${e.status}`); fail++; return; }
      if (json) { try { JSON.parse(e.stdout || out); } catch { console.log(`✗ ${name} — --json output not parseable`); fail++; return; } }
      const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
      if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
      console.log(`✓ ${name}`); pass++;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const BUG_FIXED = `bugs:\n  - id: CHECKOUT-31\n    title: checkout hangs on 3-item carts\n    observed: POST /checkout hangs 30s+ with 3 items\n    expected: completes < 2s for any cart size\n    steps:\n      - add 3 items\n      - click pay\n    environment: prod-us, node 20, postgres 15\n    status: fixed\n    root-cause: N+1 query in cart loader\n    fix: batch fetch\n    pin: tests/checkout.test.js:31\n    evidence-level: 5\n`;

await rcScenario("repro-check: complete records hold the floor", BUG_FIXED, { exitCode: 0, contains: ["hold the floor"] });

await rcScenario("repro-check: missing quartet members flagged", `bugs:\n  - id: A-1\n    title: t\n    status: open\n`, {
  exitCode: 1, contains: ["missing-observed", "missing-expected", "missing-steps", "missing-environment", "missing-evidence-level"],
});

await rcScenario("repro-check: fixed without root-cause or pin flagged", `bugs:\n  - id: A-2\n    observed: x\n    expected: y\n    steps: run it\n    environment: ci\n    status: fixed\n    evidence-level: 5\n`, {
  exitCode: 1, contains: ["missing-root-cause", "missing-pin"],
});

await rcScenario("repro-check: cannot-reproduce without instrumentation/ticket flagged", `bugs:\n  - id: A-3\n    observed: x\n    expected: y\n    steps: run it\n    environment: prod\n    status: cannot-reproduce\n    evidence-level: 1\n`, {
  exitCode: 1, contains: ["missing-instrumentation", "missing-ticket"],
});

await rcScenario("repro-check: cannot-reproduce with the honest artifact passes", `bugs:\n  - id: A-4\n    observed: x\n    expected: y\n    steps: run it\n    environment: prod\n    status: cannot-reproduce\n    instrumentation: structured logs on the boundary\n    ticket: A-4\n    evidence-level: 1\n`, {
  exitCode: 0, notContains: ["GAP"],
});

await rcScenario("repro-check: off-ladder evidence level and unknown status flagged", `bugs:\n  - id: A-5\n    observed: x\n    expected: y\n    steps: run it\n    environment: ci\n    status: resolved\n    evidence-level: 9\n`, {
  exitCode: 1, contains: ["unknown-evidence-level", "unknown-status"],
});

await rcScenario("repro-check: open bug with the quartet and rung passes", `bugs:\n  - id: A-6\n    observed: x\n    expected: y\n    steps: run it\n    environment: ci\n    status: open\n    evidence-level: reproduction\n`, {
  exitCode: 0, notContains: ["GAP"],
});

await rcScenario("repro-check: empty file refuses (no silent valid)", ``, {
  exitCode: 2, contains: ["zero bug records"],
});

await rcScenario("repro-check: JSON array shape accepted", `[{"id":"J1","observed":"x","expected":"y","steps":"z","environment":"e","status":"open","evidence-level":2}]`, {
  exitCode: 0, contains: ["hold the floor"],
});

await rcScenario("repro-check: wrong-shape JSON refuses", `"just a string"`, {
  exitCode: 2, contains: ["not a bug-record shape"],
});

// ---- bug-review daemon protocol ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await (async () => {
  const dir = TMP + "-br";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "bugs.json"), JSON.stringify([
    { id: "CHECKOUT-31", title: "checkout hangs", status: "fixed", facts: "N+1 in cart loader", repro: "repro.sh", rootCause: "per-item query", pin: "t.test.js:31" },
    { id: "CART-44", title: "flaky tax", status: "fixed", facts: "off by 1 cent" },
    { id: "BUG <5>", title: "escaped", status: "open", facts: "x & y", repro: "r.sh" },
  ]));
  // Unique per run — a stale daemon from a prior run must not poison this one
  const port = 8600 + (process.pid % 900);
  const srv = spawn("node", [REVIEW, "--bugs", "bugs.json", "--round", "r1", "--port", String(port)], { cwd: dir });
  try {
    let up = false;
    for (let i = 0; i < 20; i++) {
      try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
      await wait(150);
    }
    if (!up) { console.log("✗ bug-review: did not come up"); fail++; }
    else {
      const page = await (await fetch(`http://localhost:${port}/`)).text();
      const okGaps = page.includes("no root-cause reference") && page.includes("no pin reference");
      const okEsc = page.includes("BUG &lt;5&gt;") && page.includes("x &amp; y") && !page.includes("BUG <5>");
      if (!page.includes("CHECKOUT-31") || !okGaps || !okEsc) { console.log("✗ bug-review: entries/gap-callouts/escaping missing"); fail++; }
      else {
        console.log("✓ bug-review: serves entries, red closure gaps, escaped names"); pass++;
        const partial = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "CHECKOUT-31": "close" } }) });
        if (partial.status !== 400) { console.log("✗ bug-review: partial submit not rejected"); fail++; }
        else {
          console.log("✓ bug-review: partial submit rejected"); pass++;
          const full = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "CHECKOUT-31": "close", "CART-44": "flag", "BUG <5>": "n/a" } }) });
          if (full.status !== 200) { console.log("✗ bug-review: full submit rejected"); fail++; }
          else {
            const out = execFileSync("node", [REVIEW, "--round", "r1", "--result"], { cwd: dir, encoding: "utf8" });
            if (!out.includes('"verdict": "flag"') || !out.includes('"verdict": "close"')) { console.log("✗ bug-review: result missing verdicts"); fail++; }
            else { console.log("✓ bug-review: verdicts recorded and readable"); pass++; }
          }
        }
      }
      // Port-collision behavior: a second daemon on the same port exits 2
      const srv2 = spawn("node", [REVIEW, "--bugs", "bugs.json", "--round", "c2", "--port", String(port)], { cwd: dir });
      let collMsg = "";
      srv2.stderr.on("data", (c) => (collMsg += c));
      try {
        await wait(800);
        if (srv2.exitCode !== 2) { console.log(`✗ bug-review: port collision should exit 2, got ${srv2.exitCode}`); fail++; }
        else if (!/cannot bind port \d+/.test(collMsg)) { console.log("✗ bug-review: collision message lacks the port"); fail++; }
        else { console.log("✓ bug-review: clean exit 2 on port collision with a real message"); pass++; }
      } finally {
        srv2.kill();
      }
    }
  } finally {
    srv.kill();
    rmSync(dir, { recursive: true, force: true });
  }
})();

// ---- daemon load refusals (duplicate ids, invalid port) ----
await (async () => {
  const dir = TMP + "-br-refuse";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "dup.json"), JSON.stringify([{ id: "a" }, { id: "a" }]));
  writeFileSync(join(dir, "ok.json"), JSON.stringify([{ id: "a", repro: "r" }]));
  try {
    try {
      execFileSync("node", [REVIEW, "--bugs", "dup.json", "--round", "r1", "--port", "8601"], { cwd: dir, encoding: "utf8", timeout: 5000 });
      console.log("✗ bug-review: duplicate ids not refused"); fail++;
    } catch (e) {
      if (e.status !== 2 || !((e.stderr || "") + (e.stdout || "")).includes("unique")) { console.log("✗ bug-review: duplicate ids should exit 2 with a clear message"); fail++; }
      else { console.log("✓ bug-review: duplicate bug ids refused at load"); pass++; }
    }
    try {
      execFileSync("node", [REVIEW, "--bugs", "ok.json", "--round", "r1", "--port", "abc"], { cwd: dir, encoding: "utf8", timeout: 5000 });
      console.log("✗ bug-review: invalid port not refused"); fail++;
    } catch (e) {
      if (e.status !== 2 || !((e.stderr || "") + (e.stdout || "")).includes("1-65535")) { console.log("✗ bug-review: invalid port should exit 2 with a usage message"); fail++; }
      else { console.log("✓ bug-review: non-numeric port is a clean usage error"); pass++; }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
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
    if (s.json) {
      try { JSON.parse(e.stdout || out); } catch { console.log(`✗ ${s.name} — --json output not parseable`); fail++; continue; }
    }
    const misses = [...s.contains.filter((c) => !out.includes(c)), ...s.notContains.filter((c) => out.includes(c))];
    if (misses.length) { console.log(`✗ ${s.name} — ${misses.join(", ")}`); fail++; continue; }
    console.log(`✓ ${s.name}`);
    pass++;
  }
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\nbugcraft scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
