#!/usr/bin/env node
/**
 * Criterion behavioral evals — scenario harness.
 *
 * Pins checker behaviors the way the reference repo pins skill behaviors:
 * each scenario runs scripts/check.mjs against a fixture and asserts the
 * outcome. Zero dependencies.
 *
 * Run:  node tests/scenarios.mjs
 * Exit: 0 all scenarios pass · 1 failures
 */

import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CHECKER = join(here, "..", "scripts", "check.mjs");
const TMP = join(here, ".tmp-fixtures");

const scenarios = [];

function scenario(name, { files, args = [], exitCode, contains = [], notContains = [], json = false }) {
  scenarios.push({ name, files, args, exitCode, contains, notContains, json });
}

// --- fixtures ---
const FIX = (name, content) => [name, content];

scenario("banned default font flagged (warning severity)", {
  files: [FIX("t.css", `.a { font-family: Inter, sans-serif; }`)],
  exitCode: 0, contains: ["banned-font"],
});
scenario("deliberate workhorse font exempt", {
  files: [FIX("t.css", `.a { font-family: "IBM Plex Sans", system-ui; }`)],
  exitCode: 0, notContains: ["banned-font"],
});
scenario("pure black flagged", {
  files: [FIX("t.css", `.a { color: #000; }`)],
  exitCode: 1, contains: ["pure-black"],
});
scenario("black shadow exempt", {
  files: [FIX("t.css", `.a { box-shadow: 0 1px 2px #000; }`)],
  exitCode: 0, notContains: ["pure-black"],
});
scenario("purple-blue gradient flagged", {
  files: [FIX("t.css", `.a { background: linear-gradient(135deg, #6366f1, #3b82f6); }`)],
  exitCode: 1, contains: ["purple-blue-gradient"],
});
scenario("single-color gradient exempt", {
  files: [FIX("t.css", `.a { background: linear-gradient(180deg, #1e293b, #0f172a); }`)],
  exitCode: 0, notContains: ["purple-blue-gradient"],
});
scenario("elastic easing flagged", {
  files: [FIX("t.css", `.a { transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55); }`)],
  exitCode: 1, contains: ["elastic-easing", "transition-all"], notContains: ["slow-feedback"],
});
scenario("radius 16px+ flagged on data-dense element (warning severity)", {
  files: [FIX("t.css", `.table { border-radius: 16px; }`)],
  exitCode: 0, contains: ["radius-too-large"],
});
scenario("avatar rounded-full exempt (class form)", {
  files: [FIX("t.html", `<div class="avatar rounded-full"></div>`)],
  exitCode: 0, notContains: ["radius-too-large"],
});
scenario("avatar 9999px exempt (numeric form)", {
  files: [FIX("t.css", `.avatar { border-radius: 9999px; }`)],
  exitCode: 0, notContains: ["radius-too-large"],
});
scenario("gray-on-color needs chromatic background", {
  files: [FIX("t.css", `.a { background: #f9fafb; color: #9ca3af; }`)],
  exitCode: 0, notContains: ["gray-on-color"],
});
scenario("gray on tinted background flagged (warning severity)", {
  files: [FIX("t.css", `.a { background: #dbeafe; color: #9ca3af; }`)],
  exitCode: 0, contains: ["gray-on-color"],
});
scenario("comment prose is not evidence (multi-line block)", {
  files: [FIX("t.css", `/* Inter as a silent default, pure black,\n   transition:all — the tells, in prose */\n.a { color: #1a1d21; }`)],
  exitCode: 0, notContains: ["pure-black", "banned-font", "transition-all"],
});
scenario("deprecated marquee flagged", {
  files: [FIX("t.html", `<marquee>ticker</marquee>`)],
  exitCode: 1, contains: ["deprecated-motion"],
});
scenario("clean idiomatic file passes", {
  files: [FIX("t.css", `.surface { background:#0f1115; color:#e4e4e7; } .card { border-radius:6px; border:1px solid #26272b; } .btn { transition: opacity 150ms ease-out; }`)],
  exitCode: 0,
});
scenario("--strict fails on warnings", {
  files: [FIX("t.css", `.a { font-family: Inter, sans-serif; }`)],
  args: ["--strict"], exitCode: 1, contains: ["banned-font"],
});
scenario("--json emits machine shape", {
  files: [FIX("t.css", `.a { color: #000; }`)],
  args: ["--json"], exitCode: 1, json: true,
});

// --- runner ---
let pass = 0, fail = 0;
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

for (const s of scenarios) {
  for (const [name, content] of s.files) writeFileSync(join(TMP, name), content);
  const files = s.files.map(([name]) => join(TMP, name));
  try {
    const out = execFileSync("node", [CHECKER, ...s.args, ...files], { encoding: "utf8" });
    // exit 0
    const misses = [...s.contains.filter((c) => !out.includes(c)), ...s.notContains.filter((c) => out.includes(c))];
    if (s.exitCode !== 0) { console.log(`✗ ${s.name} — expected exit ${s.exitCode}, got 0`); fail++; continue; }
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
console.log(`\ncriterion scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
