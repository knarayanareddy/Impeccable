#!/usr/bin/env node
/**
 * Obscraft demo runner — checks the before/after code and validates the
 * before/after SLO + alert shapes. Zero dependencies.
 *
 * Run: node demos/obscraft/run-demo.mjs
 */

import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = join(here, "..", "..", "skill", "obscraft", "scripts", "check.mjs");
const tcheck = join(here, "..", "..", "skill", "obscraft", "scripts", "telemetry-check.mjs");

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "inherit" });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

console.log("═══ BEFORE (generic AI telemetry) ═══\n");
const b1 = run("node", [checker, "--strict", join(here, "before.js")]);
console.log("\n═══ AFTER (the obscraft pass) ═══\n");
const b2 = run("node", [checker, "--strict", join(here, "after.js")]);
console.log("\n═══ TELEMETRY-CHECK: before shapes ═══\n");
const b3 = run("node", [tcheck, "--slos", join(here, "before-slo.yaml"), "--alerts", join(here, "before-alerts.yaml")]);
console.log("\n═══ TELEMETRY-CHECK: after shapes ═══\n");
const b4 = run("node", [tcheck, "--slos", join(here, "after-slo.yaml"), "--alerts", join(here, "after-alerts.yaml")]);

console.log("\n═══ RESULT ═══");
console.log(`before code: exit ${b1} — the checker rejects the slop`);
console.log(`after code:  exit ${b2} — clean, the signal floor holds`);
console.log(`before shapes: exit ${b3} — the gate blocks the gap-ridden definitions`);
console.log(`after shapes:  exit ${b4} — the quartet and the contract hold`);
process.exit(b1 === 0 || b2 !== 0 || b3 === 0 || b4 !== 0 ? 1 : 0);
