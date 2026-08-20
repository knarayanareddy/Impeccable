#!/usr/bin/env node
/**
 * Testcraft demo runner — checks the before/after suites and runs the
 * suite-health aggregate on each. Zero dependencies.
 *
 * Run: node demos/testcraft/run-demo.mjs
 */

import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = join(here, "..", "..", "skill", "testcraft", "scripts", "check.mjs");

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "inherit" });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

console.log("═══ BEFORE (generic AI suite) ═══\n");
const b1 = run("node", [checker, "--strict", join(here, "before.test.js")]);
console.log("\n═══ AFTER (the testcraft pass) ═══\n");
const b2 = run("node", [checker, "--strict", join(here, "after.test.js")]);

console.log("\n═══ RESULT ═══");
console.log(`before: exit ${b1} — the checker rejects the slop`);
console.log(`after:  exit ${b2} — clean, the suite floor holds`);
process.exit(b1 === 0 || b2 !== 0 ? 1 : 0);
