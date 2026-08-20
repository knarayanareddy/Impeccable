#!/usr/bin/env node
/**
 * Criterion demo runner — checks before.html vs after.html and prints the
 * before/after comparison. Zero dependencies.
 *
 * Run: node demos/criterion/run-demo.mjs
 */

import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = join(here, "..", "..", "skill", "criterion", "scripts", "check.mjs");

function run(file) {
  try {
    execFileSync("node", [checker, "--strict", file], { stdio: "inherit" });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

console.log("═══ BEFORE (generic AI dashboard) ═══\n");
const before = run(join(here, "before.html"));
console.log("\n═══ AFTER (criterion pass) ═══\n");
const after = run(join(here, "after.html"));

console.log("\n═══ RESULT ═══");
console.log(`before.html: exit ${before} (findings above) — the checker rejects the slop`);
console.log(`after.html:  exit ${after} — clean, the floor holds`);
process.exit(before === 0 || after !== 0 ? 1 : 0);
