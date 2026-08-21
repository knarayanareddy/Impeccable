#!/usr/bin/env node
/**
 * Suite relevance evals — routing accuracy over the curated corpus.
 *
 * The uupm `evaluate-relevance.py` analog, for prose: a natural-language
 * request should route to the right skill AND the right playbook file.
 * The dataset (tests/relevance-dataset.json) has two splits — calibration
 * (used to tune the router) and held-out (untouched until the router is
 * frozen) — and per-split top-1/top-3 accuracy thresholds. A split below
 * its threshold fails the gate (exit 1): the vocabulary regressed.
 *
 * Honesty: a dataset entry pointing at a skill or file that is not in the
 * corpus is a dataset defect, refused up front (exit 2) — the eval never
 * silently re-scores against a stale corpus.
 *
 * Usage:
 *   node scripts/evaluate-relevance.mjs [--split calibration|heldOut|both] [--json]
 *
 * Exit codes: 0 thresholds hold · 1 regression · 2 usage/dataset defect
 */

import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SUITE_ROOT, buildCorpus, rankDocs } from "./lib/corpus.mjs";

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const splitArg = get("--split") || "both";
const json = argv.includes("--json");
if (!["calibration", "heldOut", "both"].includes(splitArg)) {
  console.error(`evaluate-relevance: unknown --split "${splitArg}" (calibration | heldOut | both)`);
  process.exit(2);
}

const datasetFile = join(SUITE_ROOT, "tests", "relevance-dataset.json");
if (!existsSync(datasetFile)) {
  console.error(`evaluate-relevance: ${datasetFile} not found`);
  process.exit(2);
}
let dataset;
try {
  dataset = JSON.parse(readFileSync(datasetFile, "utf8"));
} catch (e) {
  console.error(`evaluate-relevance: ${datasetFile} does not parse: ${e.message}`);
  process.exit(2);
}
const thresholds = dataset.thresholds || {};
for (const split of ["calibration", "heldOut"]) {
  if (!Array.isArray(dataset[split]) || !dataset[split].length) {
    console.error(`evaluate-relevance: dataset split "${split}" must be a non-empty array`);
    process.exit(2);
  }
  for (const [i, e] of dataset[split].entries()) {
    if (!e.query || !e.skill || !e.file) {
      console.error(`evaluate-relevance: ${split} entry #${i + 1} needs query, skill, and file`);
      process.exit(2);
    }
  }
}

const corpus = buildCorpus();
const byId = new Map(corpus.map((d) => [d.id, d]));

function evalSplit(split) {
  const entries = dataset[split];
  let top1 = 0;
  let top3 = 0;
  let topSkill1 = 0;
  let topSkill3 = 0;
  const misses = [];
  const perSkill = {};
  for (const e of entries) {
    const expected = `${e.skill}:${e.file}`;
    if (!byId.has(expected)) {
      console.error(`evaluate-relevance: ${split} entry "${e.query}" targets ${expected}, which is not in the corpus — dataset defect`);
      process.exit(2);
    }
    perSkill[e.skill] = (perSkill[e.skill] || 0) + 1;
    const ranked = rankDocs(corpus, e.query, { top: 3 });
    const files = ranked.map((r) => r.doc.id);
    const skills = ranked.map((r) => r.doc.skill);
    if (files[0] === expected) top1++;
    if (files.includes(expected)) top3++;
    if (skills[0] === e.skill) topSkill1++;
    if (skills.includes(e.skill)) topSkill3++;
    if (!files.includes(expected)) misses.push({ query: e.query, expected, got: files });
  }
  const n = entries.length;
  return {
    split,
    entries: n,
    top1: top1 / n,
    top3: top3 / n,
    topSkill1: topSkill1 / n,
    topSkill3: topSkill3 / n,
    thresholds: thresholds[split] || {},
    misses,
    perSkill,
  };
}

const results = [];
for (const split of ["calibration", "heldOut"]) {
  if (splitArg === "both" || splitArg === split) results.push(evalSplit(split));
}

let failed = false;
if (json) {
  console.log(JSON.stringify({ results }, null, 2));
} else {
  for (const r of results) {
    console.log(`\n== ${r.split} (${r.entries} queries)`);
    console.log(`   top-1 file:  ${(r.top1 * 100).toFixed(1)}%  (threshold ${Math.round((r.thresholds.top1 || 0) * 100)}%)`);
    console.log(`   top-3 file:  ${(r.top3 * 100).toFixed(1)}%  (threshold ${Math.round((r.thresholds.top3 || 0) * 100)}%)`);
    console.log(`   top-1 skill: ${(r.topSkill1 * 100).toFixed(1)}%   top-3 skill: ${(r.topSkill3 * 100).toFixed(1)}%`);
    for (const [skill, count] of Object.entries(r.perSkill)) {
      console.log(`   · ${skill}: ${count} quer${count === 1 ? "y" : "ies"}`);
    }
    for (const m of r.misses) {
      console.log(`   ✗ "${m.query}" → expected ${m.expected}, got ${m.got[0]}`);
    }
    const t = r.thresholds;
    if (r.top1 < (t.top1 ?? 1) || r.top3 < (t.top3 ?? 1)) {
      console.log(`   REGRESSION — below threshold`);
      failed = true;
    }
  }
  console.log(failed ? "\nevaluate-relevance: FAILED — routing vocabulary regressed" : "\nevaluate-relevance: thresholds hold ✓");
}
process.exit(failed ? 1 : 0);
