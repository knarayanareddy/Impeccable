#!/usr/bin/env node
/**
 * Suite evals runner.
 *
 * Discovers and runs every skill's behavioral scenarios — skill/<name>/tests/scenarios.mjs.
 * Skills without a harness yet are reported, not failed — each facet ships its
 * scenarios in its launch pass.
 *
 * Run:  node scripts/run-evals.mjs
 * Exit: 0 all harnesses green · 1 any scenario failed
 */

import { execFileSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skillRoot = join(here, "..", "skill");
const skills = readdirSync(skillRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

let failures = 0;
for (const s of skills) {
  const harness = join(skillRoot, s, "tests", "scenarios.mjs");
  if (!existsSync(harness)) {
    console.log(`— ${s}: no scenario harness yet (scheduled in its launch pass)`);
    continue;
  }
  process.stdout.write(`\n=== ${s} ===\n`);
  try {
    execFileSync("node", [harness], { stdio: "inherit" });
  } catch (e) {
    failures += 1;
  }
}
console.log(`\nrun-evals: ${failures ? failures + " skill(s) failed" : "all harnesses green"}`);
process.exit(failures ? 1 : 0);
