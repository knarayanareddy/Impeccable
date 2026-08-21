#!/usr/bin/env node
/**
 * Shipcraft ci-check — the mechanical CI-config gate over a shipped
 * workflow/pipeline. This is the extension-equivalent for shipcraft: it
 * answers "does THIS pipeline hold the floor?" with code, not vibes, and is
 * built to sit in CI as the blocking gate (run it with --strict).
 *
 * Parses the pipeline into its steps (YAML-subset workflow parser for
 * GitHub Actions / GitLab CI / Azure / CircleCI shapes, or a native JSON
 * object/array walk for JSON pipeline formats), then applies the same rule
 * vocabulary as check.mjs (shared via lib/pipeline-rules.mjs) to every
 * step's commands: red masks, secret echoes, curl|sh, unpinned installs,
 * :latest images, force flags, destructive ops, retries around tests,
 * deploys without rollback references.
 *
 * Honesty contract: a file that parses to zero steps REFUSES (exit 2)
 * instead of claiming the gate holds; wrong input shapes are refused up
 * front. Tolerated fallback: Dockerfiles, Makefiles and docker-compose
 * files have no step structure — they are line-scanned with the same rules.
 * Anything else that is not a recognizable pipeline is refused.
 *
 * Usage:
 *   node ci-check.mjs --pipeline .github/workflows/ci.yml [--strict] [--json]
 *
 * Exit codes: 0 gate holds · 1 findings (warnings only fail with --strict) ·
 *             2 usage / parse / shape refusal
 */

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { RULES, stripComments } from "./lib/pipeline-rules.mjs";

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const pipelineFile = get("--pipeline");
const json = argv.includes("--json");
const strict = argv.includes("--strict");

if (!pipelineFile) {
  console.error("ci-check: --pipeline <file> is required");
  console.error("usage: node ci-check.mjs --pipeline <workflow.yml|pipeline.json|Dockerfile|Makefile> [--strict] [--json]");
  process.exit(2);
}

let text;
try {
  text = readFileSync(pipelineFile, "utf8");
} catch (e) {
  console.error(`ci-check: cannot read ${pipelineFile}: ${e.message}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Parsing: YAML-subset workflow steps
// ---------------------------------------------------------------------------

function parseWorkflow(text) {
  const lines = text.split("\n");
  const steps = [];
  let cur = null;
  let curIndent = -1;
  let contKey = null; // when a run/script carrier is `|`/`>`-folded, deeper plain lines append here
  let blockKey = null; // last bare key seen (script:, steps:, commands:)
  let blockIndent = -1;
  const flush = () => {
    if (cur) steps.push(cur);
    cur = null;
    contKey = null;
  };
  for (const raw of lines) {
    if (!raw.trim() || /^\s*#/.test(raw)) continue;
    const indent = (raw.match(/^\s*/) || [""])[0].length;
    const item = /^(\s*)-\s+(\w[\w-]*)\s*:\s*(.*)$/.exec(raw);
    if (item) {
      const key = item[2].toLowerCase();
      const val = item[3].trim();
      if (["name", "run", "script", "command"].includes(key)) {
        flush();
        cur = { label: key === "name" ? val : "", cmd: key === "name" ? "" : val, indent };
        curIndent = indent;
        contKey = (key !== "name" && (val === "|" || val === ">")) ? "cont" : null;
      } else if (cur && indent > curIndent) {
        // e.g. `- uses: ...` directly under the workflow root — treat as a step carrier
        cur[key] = val;
        curIndent = indent;
      } else {
        flush();
        cur = { label: "", cmd: "", [key]: val, indent };
        curIndent = indent;
      }
      continue;
    }
    // GitLab-style plain list item inside a script/commands block
    const dashScalar = /^(\s*)-\s+(?![\w.-]+\s*:)(.*)$/.exec(raw);
    if (dashScalar && blockKey && ["script", "commands", "run", "steps"].includes(blockKey) && indent > blockIndent) {
      flush();
      cur = { label: dashScalar[2].trim(), cmd: dashScalar[2].trim(), indent };
      curIndent = indent;
      continue;
    }
    const bare = /^(\s*)([\w.-]+)\s*:\s*$/.exec(raw);
    if (bare) {
      blockKey = bare[2].toLowerCase();
      blockIndent = indent;
      contKey = null;
      continue;
    }
    const pair = /^(\s*)([\w.-]+)\s*:\s*(.*)$/.exec(raw);
    if (pair) {
      const key = pair[2].toLowerCase();
      const val = pair[3].trim();
      if (cur && indent > curIndent) {
        cur[key] = val;
        if (["run", "script", "command"].includes(key) && (val === "|" || val === ">")) {
          cur[key] = "";
          contKey = "cont";
        }
      }
      continue;
    }
    // Deeper-indented plain line under a `|`/`>`-folded carrier — the block
    // body. Dropping these would be a silent false-negative: a mask or a
    // secret echo inside a multi-line run must still fail the gate.
    if (cur && contKey && indent > curIndent) {
      cur[contKey] = (cur[contKey] || "") + (cur[contKey] ? "\n" : "") + raw.trim();
      continue;
    }
  }
  flush();
  return steps;
}

// ---------------------------------------------------------------------------
// Parsing: JSON pipeline walk
// ---------------------------------------------------------------------------

function jsonSteps(node, out = []) {
  if (Array.isArray(node)) {
    for (const v of node) {
      if (typeof v === "string") out.push({ label: "", cmd: v });
      else jsonSteps(v, out);
    }
    return out;
  }
  if (node && typeof node === "object") {
    for (const k of ["run", "script", "command", "commands"]) {
      const v = node[k];
      if (typeof v === "string") {
        out.push({
          label: node.name || node.label || node.job || node.title || "",
          cmd: v,
          image: typeof node.image === "string" ? node.image : undefined,
          uses: typeof node.uses === "string" ? node.uses : undefined,
        });
      }
    }
    for (const k of Object.keys(node)) {
      if (["run", "script", "command", "commands"].includes(k)) continue;
      jsonSteps(node[k], out);
    }
  }
  return out;
}

const WORKFLOW_MARKERS = /\b(jobs|stages|steps|script|commands|pipeline|workflow)\s*:/i;
const LINE_SCAN_NAMES = /^(dockerfile([._-][\w.-]*)?|.*\.dockerfile|makefile|docker-compose\.(yml|yaml)|jenkinsfile|\.gitlab-ci\.yml|azure-pipelines\.yml|bitbucket-pipelines\.yml|\.drone\.yml|\.woodpecker\.yml|pipeline\.(yml|yaml))$/i;
const base = basename(pipelineFile).toLowerCase();

let steps = [];
let mode = "";

if (/^\s*[\{\[\"]/.test(text) || /\.json$/i.test(pipelineFile)) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error(`ci-check: ${pipelineFile} looks like JSON but does not parse: ${e.message}`);
    process.exit(2);
  }
  if (parsed === null || (typeof parsed !== "object")) {
    console.error(`ci-check: ${pipelineFile} is JSON but not a pipeline shape (object/array) — refusing to claim the gate holds`);
    process.exit(2);
  }
  mode = "json";
  steps = jsonSteps(parsed);
  if (!steps.length) {
    console.error(`ci-check: ${pipelineFile} parsed to zero steps — refusing to claim the gate holds (is the pipeline keyed by run/script/command?)`);
    process.exit(2);
  }
} else {
  steps = parseWorkflow(text);
  if (steps.length) {
    mode = "workflow";
  } else if (WORKFLOW_MARKERS.test(text)) {
    console.error(`ci-check: ${pipelineFile} has workflow markers (jobs/steps/script) but parsed to zero steps — refusing to claim the gate holds`);
    process.exit(2);
  } else if (LINE_SCAN_NAMES.test(base)) {
    mode = "lines";
  } else if (/^\.github[\\/]workflows[\\/]/.test(pipelineFile) || /(^|[\\/])(\.github[\\/]workflows|\.buildkite)[\\/]/.test(pipelineFile)) {
    // a workflow file that carries no steps yet (e.g. only `on:` triggers) is
    // not a pipeline — refuse rather than pass a file with nothing to gate
    console.error(`ci-check: ${pipelineFile} is a workflow file with no steps — refusing to claim the gate holds`);
    process.exit(2);
  } else {
    console.error(`ci-check: ${pipelineFile} is not a recognized pipeline format (workflow YAML, pipeline JSON, Dockerfile, Makefile, docker-compose) — refusing to claim the gate holds`);
    process.exit(2);
  }
}

// ---------------------------------------------------------------------------
// Gate: apply the shared rule vocabulary
// ---------------------------------------------------------------------------

const findings = [];
const subjects = [];

if (mode === "lines") {
  // Dockerfile / Makefile fallback: line-level scan, comments stripped,
  // masked-failure keeps the raw line (its reason-comment escape hatch).
  const rawLines = text.split("\n");
  const lines = stripComments(rawLines, pipelineFile);
  lines.forEach((line, i) => {
    if (!line.trim()) return; // comment-only/blank line — prose, not evidence (any rule)
    for (const rule of RULES) {
      const subject = rule.id === "masked-failure" ? rawLines[i] : line;
      const detail = rule.test(subject);
      if (detail) findings.push({ step: null, line: i + 1, rule: rule.id, severity: rule.severity, message: rule.message, detail });
    }
    subjects.push({ line: i + 1, text: line });
  });
} else {
  steps.forEach((step, si) => {
    const label = step.label || step.name || step.job || `step-${si + 1}`;
    const carriers = [step.cmd, step.run, step.script, step.command, step.uses, step.image, step.cont]
      .filter((v) => typeof v === "string" && v.length);
    for (const carrier of carriers) {
      const carrierLines = carrier.split("\n");
      for (let li = 0; li < carrierLines.length; li++) {
        const line = carrierLines[li];
        if (!line.trim()) continue; // comment-only line inside a step — prose
        subjects.push({ step: label, text: line });
        for (const rule of RULES) {
          // steps carry raw command text; the reason-comment escape hatch works on it
          const detail = rule.test(line);
          if (detail) findings.push({ step: label, line: li + 1, rule: rule.id, severity: rule.severity, message: rule.message, detail });
        }
      }
    }
  });
}

const allText = subjects.map((s) => s.text).join("\n");
const retries = subjects.filter((s) => /\b(retry|retries|attempts|max_attempts)\s*:\s*[2-9]\d*\b/i.test(s.text));
const hasTests = subjects.some((s) => /\b(test|check|verify)\b/i.test(s.text) || /\b(test|check|verify)\b/i.test(s.step || ""));
if (retries.length && hasTests) {
  const rm = /\b(retry|retries|attempts|max_attempts)\s*:\s*([2-9]\d*)\b/i.exec(retries[0].text);
  findings.push({
    step: retries[0].step, line: retries[0].line, rule: "pipeline-retry", severity: "warning",
    message: "Pipeline-level retry around test/check steps — the flake still exists, now slower (H3). Root-cause it (autom).",
    detail: rm ? `${rm[1]}: ${rm[2]}` : "retry configured",
  });
}

const deployish = /\bdeploy\b|deploy\s*:|release\s*:|publish|helm\s+upgrade|kubectl\s+apply|terraform\s+apply|aws\s+deploy|gh\s+release|releases\/create/i;
const recoveryish = /\b(rollback|revert|restore|previous[_-]?(image|version|digest)|undo)\b/i;
const hasDeploy = subjects.some((s) => deployish.test(s.text) || deployish.test(s.step || ""));
const hasRecovery = recoveryish.test(allText);
if (hasDeploy && !hasRecovery) {
  findings.push({
    step: null, line: 0, rule: "deploy-without-rollback", severity: "warning",
    message: "Deploy steps with no rollback/revert reference in the pipeline — the promise nobody can keep (P1).",
    detail: "arm the revert path (see /shipcraft rollback)",
  });
}

const errors = findings.filter((f) => f.severity === "error");
const warnings = findings.filter((f) => f.severity === "warning");
const failed = errors.length + (strict ? warnings.length : 0);

if (json) {
  console.log(JSON.stringify({ pipeline: pipelineFile, mode, steps: mode === "lines" ? null : steps.length, errors, warnings, failed }, null, 2));
} else {
  const sev = (s) => (s === "error" ? "\x1b[31mERROR\x1b[0m" : "\x1b[33mWARN \x1b[0m");
  for (const f of findings) {
    const at = f.step ? `${f.step} · ${f.line}` : `${pipelineFile}:${f.line || 0}`;
    console.log(`${sev(f.severity)} ${f.rule.padEnd(22)} ${at}  ${f.message}`);
    if (f.detail && !f.message.includes(f.detail)) console.log(`        · ${f.detail}`);
  }
  console.log(
    `\nci-check: ${mode === "lines" ? "line-scan" : `${steps.length} step(s)`} · ${errors.length} error(s), ${warnings.length} warning(s)` +
      (strict ? " (--strict: warnings fail)" : "") +
      (failed ? " · GATE FAILED" : warnings.length ? " · gate holds (warnings only — run with --strict to block)" : " · gate holds ✓")
  );
}
process.exit(failed ? 1 : 0);
