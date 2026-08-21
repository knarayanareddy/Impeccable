#!/usr/bin/env node
/**
 * Shipcraft deterministic checker.
 *
 * Scans pipeline, deploy, and infra configs for the delivery-slop
 * anti-patterns in reference/anti-patterns.md. The rule vocabulary is shared
 * with scripts/ci-check.mjs via scripts/lib/pipeline-rules.mjs so the repo
 * scanner and the per-pipeline gate can never drift.
 *
 * Zero dependencies, no LLM, no API key.
 *
 * Usage:
 *   node check.mjs                     scan the project root (cwd)
 *   node check.mjs <paths...>          scan specific files/directories
 *   node check.mjs --strict            treat warnings as failures
 *   node check.mjs --json              machine-readable output
 *
 * Exit codes: 0 clean · 1 findings at/above the failure threshold · 2 usage error
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, relative, extname, basename } from "node:path";
import { RULES, stripComments } from "./lib/pipeline-rules.mjs";

const CODE_EXTS = new Set([".yml", ".yaml", ".json", ".toml", ".sh", ".bash", ".makefile", ".mk"]);
const EXTS = new Set([...CODE_EXTS]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage", "target",
  ".next", ".nuxt", ".output", "vendor", ".venv", "__pycache__",
]);

const CI_FILES = [
  ".gitlab-ci.yml", "jenkinsfile", ".circleci/config.yml", "azure-pipelines.yml",
  "bitbucket-pipelines.yml", ".drone.yml", ".woodpecker.yml", ".buildkite/pipeline.yml",
  "pipeline.yaml", "pipeline.yml", "dockerfile", "makefile", "docker-compose.yml", "docker-compose.yaml",
];
const CI_DIRS = [".github/workflows", ".buildkite", ".circleci", ".github/actions"];

function isCiFile(p) {
  const rel = p.replaceAll("\\", "/");
  const base = basename(rel).toLowerCase();
  if (CI_FILES.includes(base)) return true;
  // Dockerfile.prod / app.Dockerfile — same file, same rules
  if (/^dockerfile([._-][\w.-]*)?$|\.dockerfile$/.test(base)) return true;
  return CI_DIRS.some((d) => rel.includes(d + "/"));
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function walk(dir, acc = [], visited, visitedFiles) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      // visited set keyed by dev:ino — a symlink cycle must terminate the
      // walk, not recurse forever
      const key = `${st.dev}:${st.ino}`;
      if (visited.has(key)) continue;
      visited.add(key);
      walk(p, acc, visited, visitedFiles);
    } else if (st.isFile()) {
      // the same file reached twice through symlinks is still one file
      const key = `${st.dev}:${st.ino}`;
      if (visitedFiles.has(key)) continue;
      visitedFiles.add(key);
      acc.push(p);
    }
  }
  return acc;
}

function collect(paths) {
  const all = [];
  const visited = new Set();
  const visitedFiles = new Set();
  for (const p of paths) {
    const abs = resolve(p);
    let st;
    try {
      st = statSync(abs);
    } catch {
      console.error(`shipcraft: cannot read ${p}`);
      process.exit(2);
    }
    if (st.isDirectory()) walk(abs, all, visited, visitedFiles);
    else all.push(abs);
  }
  return [...new Set(all)];
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

function scan(file) {
  const findings = [];
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return findings;
  }
  const rawLines = text.split("\n");
  // Comments are prose, not evidence. One exception: masked-failure keeps
  // testing the RAW line — its `# reason…` escape hatch is comment evidence.
  const lines = stripComments(rawLines, file);
  const strippedText = lines.join("\n");
  const retryLines = [];

  lines.forEach((line, i) => {
    if (!line.trim()) return; // comment-only/blank line — prose, not evidence (any rule)
    const rm = /\b(retry|retries|attempts|max_attempts)\s*:\s*[2-9]\d*\b/i.exec(line);
    if (rm) retryLines.push({ line: i + 1, detail: `${rm[1]}: ${rm[0].match(/\d+/)[0]}` });
    for (const rule of RULES) {
      const subject = rule.id === "masked-failure" ? rawLines[i] : line;
      const detail = rule.test(subject);
      if (detail) {
        findings.push({ file: basename(file), line: i + 1, rule: rule.id, severity: rule.severity, message: rule.message, detail });
      }
    }
  });

  // File-level: pipeline retries around test/check steps (context-aware)
  if (retryLines.length && /\b(test|check|verify)\b/i.test(strippedText)) {
    findings.push({
      file: basename(file), line: retryLines[0].line, rule: "pipeline-retry", severity: "warning",
      message: "Pipeline-level retry around test/check steps — the flake still exists, now slower (H3). Root-cause it (autom).",
      detail: retryLines[0].detail,
    });
  }

  // File-level: deploy semantics without any rollback reference
  // note: no trailing `\b` — `deploy:` ends in a non-word char before the newline
  const deployish = /\bdeploy\b|deploy\s*:|release\s*:|publish|helm\s+upgrade|kubectl\s+apply|terraform\s+apply|aws\s+deploy|gh\s+release|releases\/create/i.test(strippedText);
  const recoveryish = /\b(rollback|revert|restore|previous[_-]?(image|version|digest)|undo)\b/i.test(strippedText);
  if (deployish && !recoveryish && isCiFile(file)) {
    findings.push({
      file: basename(file), line: 1, rule: "deploy-without-rollback", severity: "warning",
      message: "Deploy steps with no rollback/revert reference in the file — the promise nobody can keep (P1).",
      detail: "arm the revert path (see /shipcraft rollback)",
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");
  const json = argv.includes("--json");
  const paths = argv.filter((a) => !a.startsWith("--"));
  const targets = paths.length ? paths : ["."];

  const files = collect(targets);
  if (!files.length) {
    console.error("shipcraft: no files found");
    process.exit(2);
  }

  const ciFiles = files.filter((f) => isCiFile(f) || CODE_EXTS.has(extname(f).toLowerCase()));
  const findings = [];
  for (const f of ciFiles) {
    for (const fnd of scan(f)) {
      findings.push({ ...fnd, path: relative(process.cwd(), f) });
    }
  }

  // Project-level: no CI configuration anywhere (project-scope scans only)
  const hasCi = files.some((f) => isCiFile(f));
  const isProjectScope = targets.some((p) => { try { return statSync(resolve(p)).isDirectory(); } catch { return false; } }) || files.length > 1;
  if (!hasCi && isProjectScope) {
    findings.push({
      file: "(project)", line: 0, rule: "no-ci-config", severity: "warning",
      message: "No CI configuration found — the delivery system doesn't exist yet (ship-floor #10).",
      detail: "see /shipcraft pipeline",
      path: ".",
    });
  }

  // Project-level: manifests without lockfiles
  const hasManifest = files.some((f) => /package\.json$|pyproject\.toml$|go\.mod$|gemfile$|composer\.json$|cargo\.toml$/.test(basename(f).toLowerCase()));
  const hasLockfile = files.some((f) => /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|bun\.lock|poetry\.lock|uv\.lock|requirements\.lock|pipfile\.lock|go\.sum|gemfile\.lock|composer\.lock|cargo\.lock)$/i.test(basename(f)));
  if (hasManifest && !hasLockfile) {
    findings.push({
      file: "(project)", line: 0, rule: "missing-lockfile", severity: "warning",
      message: "Dependency manifest without a committed lockfile — every install is a lottery (D4).",
      detail: "commit the lockfile; install from it in CI",
      path: ".",
    });
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const failed = errors.length + (strict ? warnings.length : 0);

  if (json) {
    console.log(JSON.stringify({ files: files.length, ciFiles: ciFiles.length, errors, warnings, failed }, null, 2));
  } else {
    const sev = (s) => (s === "error" ? "\x1b[31mERROR\x1b[0m" : "\x1b[33mWARN \x1b[0m");
    for (const f of findings) {
      console.log(`${sev(f.severity)} ${f.rule.padEnd(22)} ${f.path}:${f.line}  ${f.message}`);
      if (f.detail && !f.message.includes(f.detail)) console.log(`        · ${f.detail}`);
    }
    console.log(
      `\nshipcraft: ${ciFiles.length} delivery file(s) scanned · ${errors.length} error(s), ${warnings.length} warning(s)` +
        (strict ? " (--strict: warnings fail)" : "") +
        (failed ? " · FAILED" : warnings.length ? " · warnings only (run with --strict to fail)" : " · clean ✓")
    );
  }
  process.exit(failed ? 1 : 0);
}

main();
