#!/usr/bin/env node
/**
 * Testcraft suite-health — the aggregate view over a real suite.
 *
 * Runs the deterministic checker across the suite, then aggregates the
 * findings into a ranked health report: worst files first, per-rule counts,
 * and an optional JSON history for trend tracking (the flake/focus/skip
 * debt over time). Zero dependencies.
 *
 * Usage:
 *   node suite-health.mjs [--target <dir>] [--top N] [--history history.json] [--json]
 *
 * Exit codes: 0 clean · 1 findings · 2 usage error
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CHECKER = join(here, "check.mjs");

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const target = get("--target") || ".";
const topN = parseInt(get("--top") || "10", 10);
const historyFile = get("--history");
const json = argv.includes("--json");

let out;
try {
  out = execFileSync("node", [CHECKER, "--json", target], { encoding: "utf8" });
} catch (e) {
  out = (e.stdout || "") + (e.stderr || "");
}

let report;
try {
  report = JSON.parse(out);
} catch {
  console.error("suite-health: the checker emitted unparseable output");
  process.exit(2);
}

const findings = [...report.errors, ...report.warnings];
const byFile = new Map();
const byRule = new Map();
for (const f of findings) {
  if (!byFile.has(f.path)) byFile.set(f.path, { path: f.path, errors: 0, warnings: 0 });
  const entry = byFile.get(f.path);
  if (f.severity === "error") entry.errors += 1;
  else entry.warnings += 1;
  byRule.set(f.rule, (byRule.get(f.rule) || 0) + 1);
}

const ranked = [...byFile.values()].sort(
  (a, b) => b.errors + b.warnings - (a.errors + a.warnings)
);
const totalErrors = findings.filter((f) => f.severity === "error").length;
const totalWarnings = findings.length - totalErrors;

if (json) {
  console.log(
    JSON.stringify({
      filesScanned: report.files || report.testFiles || 0,
      totalErrors,
      totalWarnings,
      worstFiles: ranked.slice(0, topN),
      ruleCounts: Object.fromEntries([...byRule.entries()].sort((a, b) => b[1] - a[1])),
    }, null, 2)
  );
} else {
  console.log(`suite-health: ${report.files || report.testFiles || 0} test file(s) · ${totalErrors} error(s), ${totalWarnings} warning(s)\n`);
  if (ranked.length) {
    console.log(`Worst files (top ${topN}):`);
    for (const f of ranked.slice(0, topN)) {
      console.log(`  ${String(f.errors + f.warnings).padStart(3)}  ${f.path}`);
    }
    console.log("\nBy rule:");
    for (const [rule, count] of [...byRule.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(count).padStart(3)}  ${rule}`);
    }
  } else {
    console.log("Nothing to report — the suite floor holds.");
  }
}

if (historyFile) {
  const record = {
    at: new Date().toISOString(),
    files: report.files || report.testFiles || 0,
    errors: totalErrors,
    warnings: totalWarnings,
    byRule: Object.fromEntries(byRule),
  };
  const history = existsSync(historyFile) ? JSON.parse(readFileSync(historyFile, "utf8")) : [];
  history.push(record);
  writeFileSync(historyFile, JSON.stringify(history, null, 2));
  if (!json) console.log(`\nhistory appended → ${historyFile} (${history.length} record(s))`);
}

process.exit(totalErrors ? 1 : 0);
