#!/usr/bin/env node
/**
 * Perfcraft budget-check — the mechanical budget gate.
 *
 * Applies a budget file (the budget command's shape) to a measurements
 * file and fails on any breach. Also validates the budget file's own
 * shape: every metric budget must state its percentile — a budget
 * without a percentile is a wish, not a budget (perf-floor #6).
 *
 * Budget file: assets/budget.example.json's shape.
 * Measurements file:
 *   {
 *     "resourceSizes":   { "script": 180, "image": 420, "total": 950 },
 *     "resourceCounts":  { "third-party": 8, "font": 2 },
 *     "metrics":         { "LCP": 2400, "INP": 180, "CLS": 0.08 },
 *     "source": "lighthouse-ci run #412"   (optional, echoed in the report)
 *   }
 *
 * Usage:
 *   node budget-check.mjs --budget budget.json --measurements m.json [--json]
 *
 * Exit codes: 0 within budget · 1 breach or invalid budget shape · 2 usage error
 */

import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const budgetFile = get("--budget");
const measurementsFile = get("--measurements");
const json = argv.includes("--json");

if (!budgetFile || !measurementsFile) {
  console.error("budget-check: usage: node budget-check.mjs --budget <budget.json> --measurements <measurements.json> [--json]");
  process.exit(2);
}

function load(f, what) {
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch (e) {
    console.error(`budget-check: cannot read ${what} ${f}: ${e.message}`);
    process.exit(2);
  }
}

const budget = load(budgetFile, "budget");
const measurements = load(measurementsFile, "measurements");

const findings = [];

// Shape validation before any iteration: a wrong-shape budget or measurements
// file exits 2 with a clear message, never an uncaught TypeError.
if (budget.resourceSizes !== undefined && !Array.isArray(budget.resourceSizes)) {
  console.error("budget-check: budget.resourceSizes must be an array of { resourceType, budget } entries");
  process.exit(2);
}
if (budget.resourceCounts !== undefined && !Array.isArray(budget.resourceCounts)) {
  console.error("budget-check: budget.resourceCounts must be an array of { resourceType, budget } entries");
  process.exit(2);
}
if (budget.metrics !== undefined && (typeof budget.metrics !== "object" || Array.isArray(budget.metrics))) {
  console.error("budget-check: budget.metrics must be an object keyed by metric name");
  process.exit(2);
}
if (typeof measurements !== "object" || Array.isArray(measurements) || measurements === null) {
  console.error("budget-check: the measurements file must be an object (resourceSizes / resourceCounts / metrics)");
  process.exit(2);
}

// ---- shape validation (the floor rule, enforced) ----
if (!Array.isArray(budget.resourceSizes) && !Array.isArray(budget.resourceCounts) && !budget.metrics) {
  findings.push({ kind: "shape", rule: "empty-budget", message: "budget file defines nothing to enforce (resourceSizes, resourceCounts, metrics all missing)" });
} else {
  if (budget.metrics) {
    for (const [name, def] of Object.entries(budget.metrics)) {
      if (!def || !def.percentile) {
        findings.push({ kind: "shape", rule: "metric-without-percentile", message: `metric budget "${name}" has no percentile — a budget without a percentile is a wish (perf-floor #6)` });
      }
    }
  }
}

// ---- resource sizes ----
let unmeasured = 0;
for (const { resourceType, budget: cap } of budget.resourceSizes || []) {
  const actual = (measurements.resourceSizes || {})[resourceType];
  if (actual === undefined) { unmeasured += 1; continue; }
  if (actual > cap) {
    findings.push({ kind: "breach", rule: "resource-size", message: `${resourceType}: ${actual}KB > budget ${cap}KB`, budget: cap, actual });
  }
}

// ---- resource counts ----
for (const { resourceType, budget: cap } of budget.resourceCounts || []) {
  const actual = (measurements.resourceCounts || {})[resourceType];
  if (actual === undefined) { unmeasured += 1; continue; }
  if (actual > cap) {
    findings.push({ kind: "breach", rule: "resource-count", message: `${resourceType}: ${actual} > budget ${cap}`, budget: cap, actual });
  }
}

// ---- metrics ----
for (const [name, def] of Object.entries(budget.metrics || {})) {
  const actual = (measurements.metrics || {})[name];
  if (actual === undefined) { unmeasured += 1; continue; }
  const cap = def.budgetMs ?? def.budget;
  if (cap === undefined) continue; // shape rule already flagged the missing percentile
  if (actual > cap) {
    findings.push({ kind: "breach", rule: "metric", message: `${name}: ${actual} > budget ${cap}${def.budgetMs !== undefined ? "ms" : ""} (${def.percentile || "no percentile"})`, budget: cap, actual });
  }
}

const totalBudgetEntries = (budget.resourceSizes || []).length + (budget.resourceCounts || []).length + Object.keys(budget.metrics || {}).length;
// The honest gate: unmeasured budget entries are visible; a green verdict on a
// budget where NOTHING was measured is a lie.
if (totalBudgetEntries > 0 && totalBudgetEntries === unmeasured) {
  findings.push({ kind: "shape", rule: "nothing-measured", message: `every budget entry is unmeasured (${unmeasured}) — the measurements file measures nothing the budget defines; wire the source before trusting a green` });
}
const breaches = findings.filter((f) => f.kind === "breach");
const shapeIssues = findings.filter((f) => f.kind === "shape");
const failed = breaches.length + shapeIssues.length;

if (json) {
  console.log(JSON.stringify({ budget: budgetFile, measurements: measurementsFile, source: measurements.source || null, breaches, shapeIssues, failed }, null, 2));
} else {
  for (const f of findings) {
    console.log(`${f.kind === "shape" ? "\x1b[33mSHAPE \x1b[0m" : "\x1b[31mBREACH\x1b[0m"} ${f.rule.padEnd(24)} ${f.message}`);
  }
  if (unmeasured && !findings.some((f) => f.rule === "nothing-measured")) {
    console.log(`budget-check: ${unmeasured} budget entr${unmeasured === 1 ? "y" : "ies"} unmeasured — visible, not silent`);
  }
  if (!findings.length) {
    console.log(`budget-check: within budget ✓ (source: ${measurements.source || "unnamed"})`);
  } else {
    console.log(`\nbudget-check: ${breaches.length} breach(es), ${shapeIssues.length} shape issue(s) · FAILED`);
  }
}
process.exitCode = failed ? 1 : 0;
