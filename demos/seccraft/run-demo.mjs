#!/usr/bin/env node
/**
 * Seccraft demo runner — checks the before/after code and runs lock-check on
 * the before/after configs. Zero dependencies.
 *
 * Run: node demos/seccraft/run-demo.mjs
 */

import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = join(here, "..", "..", "skill", "seccraft", "scripts", "check.mjs");
const lock = join(here, "..", "..", "skill", "seccraft", "scripts", "lock-check.mjs");

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "inherit" });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

console.log("═══ BEFORE (generic AI security) ═══\n");
const b1 = run("node", [checker, "--strict", join(here, "before.js")]);
console.log("\n═══ AFTER (the seccraft pass) ═══\n");
const b2 = run("node", [checker, "--strict", join(here, "after.js")]);
console.log("\n═══ LOCK-CHECK: before config ═══\n");
const b3 = run("node", [lock, "--config", join(here, "before-config.json")]);
console.log("\n═══ LOCK-CHECK: after config ═══\n");
const b4 = run("node", [lock, "--config", join(here, "after-config.json")]);

console.log("\n═══ RESULT ═══");
console.log(`before code: exit ${b1} — the checker rejects the slop`);
console.log(`after code:  exit ${b2} — clean, the security floor holds`);
console.log(`before config: exit ${b3} — the gate blocks the gap-ridden config`);
console.log(`after config:  exit ${b4} — all secure defaults present`);
process.exit(b1 === 0 || b2 !== 0 || b3 === 0 || b4 !== 0 ? 1 : 0);
