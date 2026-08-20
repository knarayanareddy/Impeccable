#!/usr/bin/env node
/**
 * Codecraft demo runner — checks before.js vs after.js and prints the
 * before/after comparison. Zero dependencies.
 *
 * Run: node demos/codecraft/run-demo.mjs
 */

import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = join(here, "..", "..", "skill", "codecraft", "scripts", "check.mjs");

function run(file) {
  try {
    execFileSync("node", [checker, "--strict", file], { stdio: "inherit" });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

console.log("═══ BEFORE (generic AI code) ═══\n");
const before = run(join(here, "before.js"));
console.log("\n═══ AFTER (the codecraft pass) ═══\n");
const after = run(join(here, "after.js"));

console.log("\n═══ RESULT ═══");
console.log(`before.js: exit ${before} (findings above) — the checker rejects the slop`);
console.log(`after.js:  exit ${after} — clean, the floor holds`);
process.exit(before === 0 || after !== 0 ? 1 : 0);
