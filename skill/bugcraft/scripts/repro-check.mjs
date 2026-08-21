#!/usr/bin/env node
/**
 * Bugcraft repro-check — the evidence floor as a mechanical gate over bug
 * records. This is the extension-equivalent for bugcraft: it answers "is
 * THIS bug record a bug, and is it closed by evidence?" with code, not
 * vibes, and is built to sit in CI as the blocking gate.
 *
 * Validates the bug-record shapes against the evidence ladder
 * (reference/domains/evidence.md + reference/evidence-floor.md):
 *
 *   - The repro signature quartet — observed, expected, steps (the repro
 *     path), environment — a record without them is a suspicion, not a bug
 *     (evidence-floor #1: the bug exists when it reproduces).
 *   - The evidence level — every claim carries its rung (0-5 or the rung
 *     name); an unlabeled claim is a bluff.
 *   - The closure contract — a `status: fixed` record without `root-cause`
 *     and `pin` is "it works now" in a green suit (floor #5, #8). A
 *     `status: cannot-reproduce` record ships the honest artifact:
 *     `instrumentation` + `ticket` (repro.md step 5).
 *
 * Honesty contract: a file that parses to zero records REFUSES (exit 2)
 * instead of claiming the gate holds; wrong input shapes are refused up
 * front. YAML-subset (bugs: list of - id: items) plus native JSON.
 *
 * Usage:
 *   node repro-check.mjs --bugs bugs.yaml [--json]
 *
 * Exit codes: 0 all records hold the floor · 1 gaps · 2 usage/parse refusal
 */

import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const bugsFile = get("--bugs");
const json = argv.includes("--json");

if (!bugsFile) {
  console.error("repro-check: --bugs <file> is required");
  console.error("usage: node repro-check.mjs --bugs bugs.yaml|bugs.json [--json]");
  process.exit(2);
}

function read(f) {
  try {
    return readFileSync(f, "utf8");
  } catch (e) {
    console.error(`repro-check: cannot read ${f}: ${e.message}`);
    process.exit(2);
  }
}

// ---------------------------------------------------------------------------
// YAML-subset parser: `bugs:` container, `- id:` list items, `key: value`
// pairs; a nested list (steps bullets) accumulates into its key as text.
// ---------------------------------------------------------------------------

function parseBugs(text) {
  const lines = text.split("\n");
  const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
  const entries = [];
  let current = null;
  let currentIndent = -1;
  let containers = {}; // key -> indent, for bare keys awaiting nested list lines
  const flush = () => {
    if (current && Object.keys(current).length) entries.push(current);
    current = null;
    containers = {};
  };
  const isItem = (l) => /^\s*-\s+([\w.-]+)\s*:\s*(.*)$/.exec(l);
  const isBare = (l) => /^\s*([\w.-]+)\s*:\s*$/.exec(l);
  const isPair = (l) => /^\s*([\w.-]+)\s*:\s*(.*)$/.exec(l);

  for (const line of lines) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const indent = indentOf(line);
    const item = isItem(line);
    if (item) {
      flush();
      current = { [item[1]]: item[2].trim() };
      currentIndent = indent;
      continue;
    }
    const bare = isBare(line);
    if (bare) {
      if (current && indent > currentIndent) containers[bare[1]] = indent;
      continue;
    }
    const pair = isPair(line);
    if (pair) {
      if (current && indent > currentIndent) {
        current[pair[1]] = pair[2].trim();
        // a folded block (`key: |` / `key: >`) opens a container: deeper lines
        // are its content — an empty fold must read as absent, not as present
        if (pair[2].trim() === "|" || pair[2].trim() === ">") {
          current[pair[1]] = "";
          containers[pair[1]] = indent;
        }
      }
      continue;
    }
    // plain deeper line — a bullet of an open container (e.g. steps:)
    if (current && indent > currentIndent) {
      for (const [key, kindent] of Object.entries(containers)) {
        if (indent > kindent) {
          current[key] = current[key] ? `${current[key]}\n${line.trim()}` : line.trim();
        }
      }
    }
  }
  flush();
  return entries;
}

function loadBugs(f) {
  const text = read(f);
  if (/^\s*[\{\[\"]/.test(text) || /\.json$/i.test(f)) {
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed.bugs;
      if (!Array.isArray(list)) {
        console.error(`repro-check: ${f} is JSON but not a bug-record shape (array or {bugs:[...]}) — refusing to claim the gate holds`);
        process.exit(2);
      }
      return list;
    } catch (e) {
      console.error(`repro-check: ${f} looks like JSON but does not parse: ${e.message}`);
      process.exit(2);
    }
  }
  return parseBugs(text);
}

const entries = loadBugs(bugsFile);
if (!entries.length) {
  console.error(`repro-check: ${bugsFile} parsed to zero bug records — refusing to claim the gate holds (is the file a bugs: list or a JSON array?)`);
  process.exit(2);
}

const STATUSES = new Set(["open", "fixed", "cannot-reproduce", "wont-fix", "duplicate"]);
const RUNG_OK = /(^|\s)[0-5](\s|$)|observation|repro|minimal[- ]?repro|confirmed[- ]?hypothesis|verified[- ]?fix/i;
const gaps = [];

for (const [i, b] of entries.entries()) {
  if (!b || typeof b !== "object") {
    console.error(`repro-check: ${bugsFile} entry #${i + 1} is not an object — refusing to claim the gate holds`);
    process.exit(2);
  }
  const id = String(b.id || b.title || b.bug || `#${i + 1}`);
  const gap = (rule, message) => gaps.push({ file: bugsFile, entry: id, rule, message });

  // The repro signature quartet — the record that makes the bug real
  if (!b.observed) gap("missing-observed", `Bug "${id}" has no observed — the symptom must be recorded before the bug exists (evidence.md rung 1)`);
  if (!b.expected) gap("missing-expected", `Bug "${id}" has no expected — without the expected behavior you cannot tell a bug from a feature (reproduction.md)`);
  if (!b.steps) gap("missing-steps", `Bug "${id}" has no steps/repro path — a failure you cannot reproduce is a suspicion, not a bug (evidence-floor #1)`);
  if (!b.environment) gap("missing-environment", `Bug "${id}" has no environment — a repro on the wrong version is a different bug (reproduction.md)`);

  // The rung — an unlabeled claim is a bluff
  if (!b["evidence-level"] && !b["evidenceLevel"]) {
    gap("missing-evidence-level", `Bug "${id}" has no evidence-level — every claim cites its rung (evidence.md ladder)`);
  } else if (!RUNG_OK.test(String(b["evidence-level"] ?? b["evidenceLevel"]))) {
    gap("unknown-evidence-level", `Bug "${id}" evidence-level "${b["evidence-level"] ?? b["evidenceLevel"]}" is not a rung — the ladder is 0-5 / observation / repro / minimal-repro / confirmed-hypothesis / verified-fix (evidence.md)`);
  }

  // The status and the closure contract
  const status = String(b.status || "").toLowerCase();
  if (!status) {
    gap("missing-status", `Bug "${id}" has no status — open / fixed / cannot-reproduce / wont-fix / duplicate`);
  } else if (!STATUSES.has(status)) {
    gap("unknown-status", `Bug "${id}" status "${b.status}" is not in the vocabulary (open/fixed/cannot-reproduce/wont-fix/duplicate)`);
  } else if (status === "fixed") {
    if (!b["root-cause"] && !b["rootCause"]) {
      gap("missing-root-cause", `Bug "${id}" is fixed with no root-cause — "it works now" is a hypothesis, not a conclusion (evidence-floor #8)`);
    }
    if (!b.pin) {
      gap("missing-pin", `Bug "${id}" is fixed with no pin — every fix ships a regression test with the exact input that broke (evidence-floor #5)`);
    }
  } else if (status === "cannot-reproduce") {
    if (!b.instrumentation) {
      gap("missing-instrumentation", `Bug "${id}" is cannot-reproduce with no instrumentation — the honest artifact is the instrumentation + the ticket (repro.md step 5)`);
    }
    if (!b.ticket) {
      gap("missing-ticket", `Bug "${id}" is cannot-reproduce with no ticket — the honest artifact is the instrumentation + the ticket (repro.md step 5)`);
    }
  }
}

if (json) {
  console.log(JSON.stringify({ gaps, gapCount: gaps.length }, null, 2));
} else {
  if (!gaps.length) {
    console.log("repro-check: all bug records hold the floor ✓");
  } else {
    for (const g of gaps) {
      console.log(`\x1b[31mGAP\x1b[0m ${g.rule.padEnd(26)} ${g.message}`);
    }
    console.log(`\nrepro-check: ${gaps.length} gap(s) · FAILED`);
  }
}
process.exit(gaps.length ? 1 : 0);
