#!/usr/bin/env node
/**
 * Bugcraft demo runner — checks the before/after code and validates the
 * before/after bug records with the repro-check gate. Zero dependencies.
 *
 * Run: node demos/bugcraft/run-demo.mjs
 */

import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = join(here, "..", "..", "skill", "bugcraft", "scripts", "check.mjs");
const rcheck = join(here, "..", "..", "skill", "bugcraft", "scripts", "repro-check.mjs");

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "inherit" });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

console.log("═══ BEFORE (generic AI ‘fix’) — checker ═══\n");
const b1 = run("node", [checker, "--strict", join(here, "before.js")]);
console.log("\n═══ AFTER (the bugcraft pass) — checker ═══\n");
const b2 = run("node", [checker, "--strict", join(here, "after.js")]);
console.log("\n═══ BEFORE — repro-check gate on the records ═══\n");
const b3 = run("node", [rcheck, "--bugs", join(here, "before-bugs.yaml")]);
console.log("\n═══ AFTER — repro-check gate on the records ═══\n");
const b4 = run("node", [rcheck, "--bugs", join(here, "after-bugs.yaml")]);

console.log("\n═══ RESULT ═══");
console.log(`before code: exit ${b1} — the checker rejects the debugging slop`);
console.log(`after code:  exit ${b2} — clean, the crime scene is cleared`);
console.log(`before records: exit ${b3} — the gate blocks the evidence gaps`);
console.log(`after records:  exit ${b4} — the quartet, the rung, and the closure hold`);
process.exit(b1 === 0 || b2 !== 0 || b3 === 0 || b4 !== 0 ? 1 : 0);
