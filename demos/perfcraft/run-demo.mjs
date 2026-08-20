#!/usr/bin/env node
/**
 * Perfcraft demo runner — checks the before/after code and runs the budget
 * gate on an under-budget vs over-budget measurement pair. Zero dependencies.
 *
 * Run: node demos/perfcraft/run-demo.mjs
 */

import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = join(here, "..", "..", "skill", "perfcraft", "scripts", "check.mjs");
const budget = join(here, "..", "..", "skill", "perfcraft", "scripts", "budget-check.mjs");
const budgetFile = join(here, "..", "..", "skill", "perfcraft", "assets", "budget.example.json");

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "inherit" });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

console.log("═══ BEFORE (generic AI performance) ═══\n");
const b1 = run("node", [checker, "--strict", join(here, "before.js")]);
console.log("\n═══ AFTER (the perfcraft pass) ═══\n");
const b2 = run("node", [checker, "--strict", join(here, "after.js")]);

console.log("\n═══ BUDGET GATE: over budget ═══\n");
const b3 = run("node", [budget, "--budget", budgetFile, "--measurements", join(here, "over-budget.json")]);
console.log("\n═══ BUDGET GATE: under budget ═══\n");
const b4 = run("node", [budget, "--budget", budgetFile, "--measurements", join(here, "under-budget.json")]);

console.log("\n═══ RESULT ═══");
console.log(`before: exit ${b1} — the checker rejects the slop`);
console.log(`after:  exit ${b2} — clean, the perf floor holds`);
console.log(`over-budget:  exit ${b3} — the gate blocks, as it should`);
console.log(`under-budget: exit ${b4} — the gate passes`);
process.exit(b1 === 0 || b2 !== 0 || b3 === 0 || b4 !== 0 ? 1 : 0);
