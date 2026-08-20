#!/usr/bin/env node
/**
 * Apicraft demo runner — checks the before/after specs and handlers and
 * runs the contract-diff on the specs. Zero dependencies.
 *
 * Run: node demos/apicraft/run-demo.mjs
 */

import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = join(here, "..", "..", "skill", "apicraft", "scripts", "check.mjs");
const diff = join(here, "..", "..", "skill", "apicraft", "scripts", "contract-diff.mjs");

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "inherit" });
    return 0;
  } catch (e) {
    return e.status || 1;
  }
}

console.log("═══ BEFORE (generic AI API) ═══\n");
const b1 = run("node", [checker, "--strict", join(here, "before-handler.js"), join(here, "before-spec.yaml")]);
console.log("\n═══ AFTER (the apicraft pass) ═══\n");
const b2 = run("node", [checker, "--strict", join(here, "after-handler.js"), join(here, "after-spec.yaml")]);
console.log("\n═══ CONTRACT-DIFF (before-spec → after-spec) ═══\n");
const b3 = run("node", [diff, join(here, "before-spec.yaml"), join(here, "after-spec.yaml")]);

console.log("\n═══ RESULT ═══");
console.log(`before: exit ${b1} — the checker rejects the slop`);
console.log(`after:  exit ${b2} — clean, the contract floor holds`);
console.log(`contract-diff: exit ${b3} — the before→after rewrite IS breaking by design; a real migration ships as a versioned release (the deprecation protocol), and the diff is the justification`);
process.exit(b1 === 0 || b2 !== 0 ? 1 : 0);
