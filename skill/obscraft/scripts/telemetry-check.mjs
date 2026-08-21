#!/usr/bin/env node
/**
 * Obscraft telemetry-check — the question-first doctrine as a mechanical gate.
 *
 * Validates the telemetry CONFIG shapes: SLO definitions (SLI + target +
 * window + owner), alert definitions (condition + action + runbook + owner),
 * and metric vocabularies (name + type + question). Zero dependencies;
 * a YAML-subset block parser (indentation-aware) plus native JSON.
 *
 * Usage:
 *   node telemetry-check.mjs --slos slo.yaml [--alerts alerts.yaml]
 *                            [--metrics metrics.json] [--json]
 *   At least one input is required.
 *
 * Exit codes: 0 all shapes valid · 1 gaps · 2 usage/parse refusal
 */

import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const slosFile = get("--slos");
const alertsFile = get("--alerts");
const metricsFile = get("--metrics");
const json = argv.includes("--json");

if (!slosFile && !alertsFile && !metricsFile) {
  console.error("telemetry-check: at least one of --slos / --alerts / --metrics is required");
  process.exit(2);
}

function read(f) {
  try {
    return readFileSync(f, "utf8");
  } catch (e) {
    console.error(`telemetry-check: cannot read ${f}: ${e.message}`);
    process.exit(2);
  }
}

// ---------------------------------------------------------------------------
// YAML-subset block parser: `key:` blocks and `- name:` list items.
// Returns an array of plain objects (one per block/item).
// ---------------------------------------------------------------------------

function parseBlocks(text) {
  const lines = text.split("\n");
  const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
  const entries = [];
  let current = null;
  let currentIndent = -1;
  // Container keys (slo:, alerts:) open a block whose children are the real
  // entries — an empty container block is never an entry itself.
  const flush = () => {
    if (current && Object.keys(current).length) entries.push(current);
    current = null;
  };
  const kv = (l) => /^\s*([\w.-]+)\s*:\s*(.*)$/.exec(l);
  const isKey = (l) => /^\s*([\w.-]+)\s*:\s*$/.exec(l);
  const isItem = (l) => /^\s*-\s+([\w.-]+)\s*:\s*(.*)$/.exec(l);

  for (const line of lines) {
    if (line.trim() === "" || /^\s*#/.test(line)) continue;
    const indent = indentOf(line);
    const item = isItem(line);
    const key = isKey(line);
    const pair = kv(line);

    if (item) {
      flush();
      current = { [item[1]]: item[2].trim() };
      currentIndent = indent;
      continue;
    }
    if (key) {
      if (current && indent <= currentIndent) flush();
      if (!current) { current = {}; currentIndent = indent; }
      // a bare key opens a block whose children are pairs
      continue;
    }
    if (pair && current) {
      const m = /^-\s+(.*)$/.exec(line); // nested list values (runbook bullets) — keep as text
      current[pair[1]] = pair[2].trim();
    }
  }
  flush();
  return entries;
}

function loadConfig(f) {
  const text = read(f);
  if (/^\s*\{/.test(text) || /^\s*\[/.test(text)) {
    try {
      const parsed = JSON.parse(text);
      return { entries: Array.isArray(parsed) ? parsed : parsed.entries || [], format: "json" };
    } catch (e) {
      console.error(`telemetry-check: ${f} looks like JSON but does not parse: ${e.message}`);
      process.exit(2);
    }
  }
  return { entries: parseBlocks(text), format: "yaml" };
}

const gaps = [];

// ---- SLOs: the signal floor's shape (SLI + target + window + owner) ----
if (slosFile) {
  const { entries, format } = loadConfig(slosFile);
  if (!entries.length) {
    console.error(`telemetry-check: ${slosFile} parsed to zero SLOs — refusing to claim valid shapes (is the file structured as SLO blocks or a list?)`);
    process.exit(2);
  }
  for (const [i, slo] of entries.entries()) {
    const label = slo.name || slo.sli || `#${i + 1}`;
    for (const req of ["sli", "target", "window", "owner"]) {
      if (!slo[req]) gaps.push({ file: slosFile, kind: "slo", entry: label, rule: `missing-${req}`, message: `SLO "${label}" has no ${req} — the SLI/target/window/owner quartet is the SLO (slos.md)` });
    }
    if (slo.target !== undefined && /^100\s*$|^1\.0+$|^100\.0+$/.test(String(slo.target).trim())) {
      gaps.push({ file: slosFile, kind: "slo", entry: label, rule: "impossible-target", message: `SLO "${label}" targets ${slo.target} — a 100% target is unspendable and uninformative (anti-patterns.md S3)` });
    }
  }
}

// ---- Alerts: the actionability contract (owner + runbook; condition is the expr) ----
if (alertsFile) {
  const { entries } = loadConfig(alertsFile);
  if (!entries.length) {
    console.error(`telemetry-check: ${alertsFile} parsed to zero alerts — refusing to claim valid shapes`);
    process.exit(2);
  }
  for (const [i, alert] of entries.entries()) {
    const label = alert.name || alert.alert || `#${i + 1}`;
    for (const req of ["owner", "runbook"]) {
      if (!alert[req]) gaps.push({ file: alertsFile, kind: "alert", entry: label, rule: `missing-${req}`, message: `Alert "${label}" has no ${req} — the page names the action, the runbook, and the owner, or it doesn't exist (alerts.md)` });
    }
    if (!alert.expr && !alert.condition && !alert.threshold) {
      gaps.push({ file: alertsFile, kind: "alert", entry: label, rule: "missing-condition", message: `Alert "${label}" has no condition/expr — the alert states what it watches (alerts.md)` });
    }
  }
}

// ---- Metrics: the vocabulary (name + type + question) ----
if (metricsFile) {
  const { entries } = loadConfig(metricsFile);
  if (!entries.length) {
    console.error(`telemetry-check: ${metricsFile} parsed to zero metrics — refusing to claim valid shapes`);
    process.exit(2);
  }
  for (const [i, metric] of entries.entries()) {
    const label = metric.name || `#${i + 1}`;
    if (!metric.name) gaps.push({ file: metricsFile, kind: "metric", entry: label, rule: "missing-name", message: "metric entry has no name" });
    if (!metric.type) gaps.push({ file: metricsFile, kind: "metric", entry: label, rule: "missing-type", message: `metric "${label}" has no type (counter/gauge/histogram — metrics.md)` });
    else if (!["counter", "gauge", "histogram", "summary"].includes(String(metric.type).toLowerCase())) {
      gaps.push({ file: metricsFile, kind: "metric", entry: label, rule: "unknown-type", message: `metric "${label}" has unknown type "${metric.type}" — the vocabulary is counter/gauge/histogram/summary (metrics.md)` });
    }
    if (!metric.question) gaps.push({ file: metricsFile, kind: "metric", entry: label, rule: "missing-question", message: `metric "${label}" has no question — a metric must name the question it answers (telemetry.md)` });
  }
}

if (json) {
  console.log(JSON.stringify({ gaps, gapCount: gaps.length }, null, 2));
} else {
  if (!gaps.length) {
    console.log("telemetry-check: all shapes valid ✓");
  } else {
    for (const g of gaps) {
      console.log(`\x1b[31mGAP\x1b[0m ${g.kind.padEnd(7)} ${g.rule.padEnd(22)} ${g.message}`);
    }
    console.log(`\ntelemetry-check: ${gaps.length} gap(s) · FAILED`);
  }
}
process.exitCode = gaps.length ? 1 : 0;
