#!/usr/bin/env node
/**
 * Codecraft behavioral evals — scenario harness.
 *
 * Pins checker behaviors (severity semantics, exemptions, windowed detection,
 * comment stripping) plus the hooks manager and live-daemon protocols.
 * Zero dependencies.
 *
 * Run:  node tests/scenarios.mjs
 * Exit: 0 all pass · 1 failures
 */

import { execFileSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CHECKER = join(here, "..", "scripts", "check.mjs");
const HOOKS = join(here, "..", "scripts", "hooks.mjs");
const LIVE = join(here, "..", "scripts", "live.mjs");
const TMP = join(here, ".tmp-fixtures");
let pass = 0, fail = 0;

const scenarios = [];
function scenario(name, { files, args = [], exitCode, contains = [], notContains = [], json = false }) {
  scenarios.push({ name, files, args, exitCode, contains, notContains, json });
}
const FIX = (name, content) => [name, content];

// ---- checker scenarios (severity semantics per the rule definitions) ----
scenario("magic number in logic flagged (warning)", {
  files: [FIX("t.js", `if (x > 47) { work(); }`)],
  exitCode: 0, contains: ["magic-number"],
});
scenario("whitelist and named constants exempt", {
  files: [FIX("t.js", `const MAX_ITEMS = 47;\nif (x > MAX_ITEMS) { work(); }\nif (y > 24) { work(); }`)],
  exitCode: 0, notContains: ["magic-number"],
});
scenario("swallowed exception single-line flagged (error)", {
  files: [FIX("t.js", `try { work(); } catch (e) {}`)],
  exitCode: 1, contains: ["swallowed-error"],
});
scenario("comment-only catch body flagged (error)", {
  files: [FIX("t.js", `try { work(); } catch (e) { /* TODO handle */ }`)],
  exitCode: 1, contains: ["swallowed-error"],
});
scenario("windowed multi-line comment-only catch flagged (error)", {
  files: [FIX("t.js", `try {\n  work();\n} catch (e) {\n  // remember to handle this\n}`)],
  exitCode: 1, contains: ["swallowed-error"],
});
scenario("windowed bare-return catch flagged (warning)", {
  files: [FIX("t.js", `try {\n  work();\n} catch (e) {\n  return;\n}`)],
  exitCode: 0, contains: ["silent-catch-return"],
});
scenario("real catch body clean (rethrow)", {
  files: [FIX("t.js", `try { work(); } catch (e) { throw new Error("wrapped: " + e.message); }`)],
  exitCode: 0, notContains: ["swallowed-error", "silent-catch-return"],
});
scenario("debug marker flagged (error)", {
  files: [FIX("t.js", `console.log("here");`)],
  exitCode: 1, contains: ["debug-statement"],
});
scenario("comment prose mentioning console.log is not a marker", {
  files: [FIX("t.js", `// remember: console.log stays out of prod\nconst x = 1;`)],
  exitCode: 0, notContains: ["debug-statement"],
});
scenario("commented-out code still flagged as C2", {
  files: [FIX("t.js", `// console.log("old debug");\nconst x = 1;`)],
  exitCode: 0, contains: ["commented-out-code"],
});
scenario("ts-any flagged; unknown clean", {
  files: [FIX("t.ts", `function f(x: any) { return x; }\nfunction g(x: unknown) { return x; }`)],
  exitCode: 0, contains: ["ts-any", ": any"], notContains: ["x: unknown"],
});
scenario("suppression without reason flagged; with reason clean", {
  files: [FIX("t.ts", `// @ts-ignore\nexport const a = 1;\n// @ts-ignore rule X — reason: legacy interop\nconst b = 2;`)],
  exitCode: 0, contains: ["suppression"],
});
scenario("loose equality flagged; strict clean", {
  files: [FIX("t.js", `if (a == b) { work(); }\nif (c === d) { work(); }`)],
  exitCode: 0, contains: ["loose-equality"],
});
scenario("legacy var flagged", {
  files: [FIX("t.js", `var userName = "data";`)],
  exitCode: 0, contains: ["legacy-var"],
});
scenario("deep nesting flagged at 5+; depth 3 clean", {
  files: [FIX("t.js", `function a() {\n  if (x) {\n    if (y) {\n      if (z) {\n        if (w) {\n          if (v) {\n            work();\n          }\n        }\n      }\n    }\n  }\n}`)],
  exitCode: 0, contains: ["deep-nesting"],
});
scenario("vague signature name flagged; precise clean", {
  files: [FIX("t.js", `function processData(items) { return items; }\nfunction retryPayment(order) { return order; }`)],
  exitCode: 0, contains: ["vague-name"],
});
scenario("todo sprawl at 5+ flagged; two TODOs clean", {
  files: [FIX("t.js", `// TODO a\n// TODO b\n// TODO c\n// TODO d\n// TODO e\nconst x = 1;`)],
  exitCode: 0, contains: ["todo-sprawl"],
});
scenario("URL double-slashes are not comment starts", {
  files: [FIX("t.js", `const u = "http://localhost:3000/api";\nconsole.log(u);`)],
  exitCode: 1, contains: ["debug-statement"],
});
scenario("clean idiomatic file passes", {
  files: [FIX("t.ts", `const MAX_ITEMS = 47;\nexport function processItems(items: string[], opts?: { force?: boolean }): string[] {\n  if (!items || items.length === 0) return [];\n  if (items.length > MAX_ITEMS && !opts?.force) return items.slice(0, MAX_ITEMS);\n  try {\n    return items.map((item) => \`\${item}-ok\`);\n  } catch (err) {\n    throw new Error(\`processItems: failed for \${items.length} items\`, { cause: err });\n  }\n}`)],
  exitCode: 0,
});
scenario("--strict fails on warnings", {
  files: [FIX("t.js", `var x = 1;`)],
  args: ["--strict"], exitCode: 1, contains: ["legacy-var"],
});
scenario("--json emits machine shape", {
  files: [FIX("t.js", `console.log("here");`)],
  args: ["--json"], exitCode: 1, json: true,
});

// ---- hooks manager protocol scenarios ----
async function protoScenario(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    pass++;
  } catch (e) {
    console.log(`✗ ${name} — ${e.message}`);
    fail++;
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await (async () => {
  await protoScenario("hooks: on --apply wires and status reports wired", async () => {
    const dir = TMP + "-hooks";
    mkdirSync(dir, { recursive: true });
    try {
      let notWired = false;
      try { execFileSync("node", [HOOKS, "status"], { cwd: dir, encoding: "utf8", stdio: "pipe" }); }
      catch (e) { notWired = e.status === 1; }
      if (!notWired) throw new Error("status should exit 1 (not wired) on a fresh project");
      execFileSync("node", [HOOKS, "on", "--apply"], { cwd: dir, stdio: "pipe" });
      let out = execFileSync("node", [HOOKS, "status"], { cwd: dir, encoding: "utf8", stdio: "pipe" });
      if (!out.includes("wired")) throw new Error("status not wired after --apply");
      const settings = JSON.parse(readFileSync(join(dir, ".claude", "settings.json"), "utf8"));
      if (!JSON.stringify(settings).includes("codecraft")) throw new Error("settings missing the hook");
      execFileSync("node", [HOOKS, "off", "--apply"], { cwd: dir, stdio: "pipe" });
      let stillWired = false;
      try {
        const out2 = execFileSync("node", [HOOKS, "status"], { cwd: dir, encoding: "utf8", stdio: "pipe" });
        if (out2.includes("wired")) stillWired = true;
      } catch (e) {
        stillWired = false; // exit 1 = not wired — the expected state
      }
      if (stillWired) throw new Error("status still wired after off --apply");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await protoScenario("hooks: dry run prints the merge without writing", async () => {
    const dir = TMP + "-hooks2";
    mkdirSync(dir, { recursive: true });
    try {
      const out = execFileSync("node", [HOOKS, "on"], { cwd: dir, encoding: "utf8" });
      if (!out.includes("PostToolUse")) throw new Error("dry run missing the snippet");
      let exists = true;
      try { readFileSync(join(dir, ".claude", "settings.json")); } catch { exists = false; }
      if (exists) throw new Error("dry run wrote the file");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await protoScenario("hooks: refuses to overwrite an unparseable settings file", async () => {
    const dir = TMP + "-hooks3";
    mkdirSync(dir, { recursive: true });
    try {
      mkdirSync(join(dir, ".claude"), { recursive: true });
      writeFileSync(join(dir, ".claude", "settings.json"), "{ not valid json");
      let refused = false;
      try { execFileSync("node", [HOOKS, "on", "--apply"], { cwd: dir, stdio: "pipe" }); }
      catch (e) { refused = e.status === 2; }
      if (!refused) throw new Error("did not refuse to overwrite corrupt settings");
      if (readFileSync(join(dir, ".claude", "settings.json"), "utf8") !== "{ not valid json") throw new Error("corrupt file was modified");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await protoScenario("hooks: double on --apply stays idempotent (one entry)", async () => {
    const dir = TMP + "-hooks4";
    mkdirSync(dir, { recursive: true });
    try {
      execFileSync("node", [HOOKS, "on", "--apply"], { cwd: dir, stdio: "pipe" });
      execFileSync("node", [HOOKS, "on", "--apply"], { cwd: dir, stdio: "pipe" });
      const settings = JSON.parse(readFileSync(join(dir, ".claude", "settings.json"), "utf8"));
      const entries = (settings.hooks.PostToolUse || []).filter((e) => JSON.stringify(e).includes("codecraft"));
      if (entries.length !== 1) throw new Error(`expected 1 codecraft entry, got ${entries.length}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await protoScenario("live: option names are escaped on the decision page", async () => {
    const dir = TMP + "-live3";
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "a.json"), JSON.stringify({ name: "<script>alert(1)</script>", rationale: "r", code: "x()" }));
    const port = 8993;
    const srv = spawn("node", [LIVE, "--round", "s3", "--port", String(port), "--options", "a.json"], { cwd: dir });
    try {
      let up = false;
      for (let i = 0; i < 20; i++) {
        try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
        await wait(150);
      }
      if (!up) throw new Error("daemon did not come up");
      const html = await (await fetch(`http://localhost:${port}/`)).text();
      if (html.includes("<script>alert(1)")) throw new Error("option name not escaped");
      if (!html.includes("&lt;script&gt;")) throw new Error("escaped name missing");
    } finally {
      srv.kill();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await protoScenario("live: serve → choose → --wait resolves the recorded choice", async () => {
    const dir = TMP + "-live";
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "a.json"), JSON.stringify({ name: "A — guard clauses", rationale: "depth 5 → 2", code: "function ship(o) {\n  if (!o) return;\n}" }));
    const port = 8991;
    const srv = spawn("node", [LIVE, "--round", "s1", "--port", String(port), "--options", "a.json"], { cwd: dir });
    try {
      let up = false;
      for (let i = 0; i < 20; i++) {
        try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
        await wait(150);
      }
      if (!up) throw new Error("daemon did not come up");
      const res = await fetch(`http://localhost:${port}/choose`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ option: "A — guard clauses" }),
      });
      if (res.status !== 200) throw new Error("choose rejected");
      const out = execFileSync("node", [LIVE, "--round", "s1", "--result"], { cwd: dir, encoding: "utf8" });
      if (!out.includes('"chosen": "A — guard clauses"')) throw new Error("result missing the choice");
    } finally {
      srv.kill();
      rmSync(dir, { recursive: true, force: true });
    }
  });
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
      try { JSON.parse(out); } catch { console.log(`✗ ${s.name} — --json output not parseable`); fail++; continue; }
    }
    const misses = [...s.contains.filter((c) => !out.includes(c)), ...s.notContains.filter((c) => out.includes(c))];
    if (misses.length) { console.log(`✗ ${s.name} — ${misses.join(", ")}`); fail++; continue; }
    console.log(`✓ ${s.name}`);
    pass++;
  }
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\ncodecraft scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
