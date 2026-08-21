#!/usr/bin/env node
/**
 * Shipcraft demo runner — checks the before/after workflow and gates the
 * before/after pipeline with ci-check. Zero dependencies.
 *
 * Run: node demos/shipcraft/run-demo.mjs
 */

import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = join(here, "..", "..", "skill", "shipcraft", "scripts", "check.mjs");
const gate = join(here, "..", "..", "skill", "shipcraft", "scripts", "ci-check.mjs");

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "inherit" });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

console.log("═══ BEFORE (generic-AI workflow) — checker ═══\n");
const b1 = run("node", [checker, "--strict", join(here, "before-workflow.yml")]);
console.log("\n═══ AFTER (the shipcraft pass) — checker ═══\n");
const b2 = run("node", [checker, "--strict", join(here, "after-workflow.yml")]);
console.log("\n═══ BEFORE — ci-check gate ═══\n");
const b3 = run("node", [gate, "--pipeline", join(here, "before-workflow.yml"), "--strict"]);
console.log("\n═══ AFTER — ci-check gate ═══\n");
const b4 = run("node", [gate, "--pipeline", join(here, "after-workflow.yml"), "--strict"]);

console.log("\n═══ RESULT ═══");
console.log(`before checker: exit ${b1} — the checker rejects the slop`);
console.log(`after checker:  exit ${b2} — clean, the floor holds`);
console.log(`before gate:    exit ${b3} — the pipeline gate blocks the before`);
console.log(`after gate:     exit ${b4} — the gate holds on the after`);
process.exit(b1 === 0 || b2 !== 0 || b3 === 0 || b4 !== 0 ? 1 : 0);
