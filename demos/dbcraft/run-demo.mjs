#!/usr/bin/env node
/**
 * Dbcraft demo runner — checks the before/after schemas and runs schema-diff
 * on the destructive vs expand/contract migration paths. Zero dependencies.
 *
 * Run: node demos/dbcraft/run-demo.mjs
 */

import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = join(here, "..", "..", "skill", "dbcraft", "scripts", "check.mjs");
const diff = join(here, "..", "..", "skill", "dbcraft", "scripts", "schema-diff.mjs");

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "inherit" });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

console.log("═══ BEFORE (generic AI schema) ═══\n");
const b1 = run("node", [checker, "--strict", join(here, "before.sql")]);
console.log("\n═══ AFTER (the dbcraft pass) ═══\n");
const b2 = run("node", [checker, "--strict", join(here, "after.sql")]);
console.log("\n═══ SCHEMA-DIFF: destructive one-step migration (v1 → v2-destructive) ═══\n");
const b3 = run("node", [diff, join(here, "v1.sql"), join(here, "v2-destructive.sql")]);
console.log("\n═══ SCHEMA-DIFF: expand/contract migration (v1 → v2-expand-contract) ═══\n");
const b4 = run("node", [diff, join(here, "v1.sql"), join(here, "v2-expand-contract.sql")]);

console.log("\n═══ RESULT ═══");
console.log(`before: exit ${b1} — the checker rejects the slop`);
console.log(`after:  exit ${b2} — clean, the schema floor holds`);
console.log(`destructive path: exit ${b3} — BREAKING, as it should be`);
console.log(`expand/contract path: exit ${b4} — additive, no breaking changes`);
process.exit(b1 === 0 || b2 !== 0 || b3 === 0 || b4 !== 0 ? 1 : 0);
