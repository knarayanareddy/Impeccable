#!/usr/bin/env node
/**
 * Shipcraft deterministic checker.
 *
 * Scans pipeline, deploy, and infra configs for the delivery-slop
 * anti-patterns in reference/anti-patterns.md.
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

const SECRET_NAME = /\b(password|passwd|secrets?|api[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key|credential|client[_-]?secret|signing[_-]?key|jwt[_-]?secret)\w*/i;

function isCiFile(p) {
  const rel = p.replaceAll("\\", "/");
  const base = basename(rel).toLowerCase();
  if (CI_FILES.includes(base)) return true;
  return CI_DIRS.some((d) => rel.includes(d + "/"));
}

// ---------------------------------------------------------------------------
// Line rules (applied to CI files only; code exts get a conservative subset)
// ---------------------------------------------------------------------------

const rules = [
  {
    id: "secret-echo",
    severity: "error",
    message: "Secret echoed in a pipeline step — the build log becomes a credential store (S1). Reference by name, never print.",
    test(line) {
      if (!SECRET_NAME.test(line)) return null;
      const isEcho = /\b(echo|printf)\b/i.test(line) || /\bprintenv\b/i.test(line) || /\benv\b/i.test(line) && !/env\s*:/i.test(line);
      if (!isEcho) return null;
      return "secret in log output";
    },
  },
  {
    id: "pipe-to-shell",
    severity: "warning",
    message: "curl/wget piped to shell — executing the internet with CI's permissions (H4). Use pinned, checksummed installers.",
    test(line) {
      const m = /\b(curl|wget)\b[^|]*\|\s*(?:sudo\s+)?(?:ba)?sh\b/i.exec(line);
      if (m) return "curl | sh";
      // to-file-then-execute form: curl -o install.sh URL && bash install.sh
      if (/\b(curl|wget)\b[^;]*-(?:o|output)\s+\S+[^;]*(?:&&|;)\s*(?:sudo\s+)?(?:ba)?sh\b/i.test(line)) return "curl -o file && sh";
      return null;
    },
  },
  {
    id: "masked-failure",
    severity: "error",
    message: "Red mask — the step's failure is swallowed (H1). Fix the step or delete it; a mask is an incident in waiting.",
    test(line) {
      const m = /\|\|\s*(true|exit\s+0)\s*;?|continue-on-error\s*:\s*true|allow_failure\s*:\s*true|^\s*set\s+\+e\b/i.exec(line);
      if (!m) return null;
      // A written reason keeps it a reviewed exception, not a mask
      if (/#.*(reason|because|ticket|issue|known|temporary|todo|fixme)/i.test(line)) return null;
      return m[0].trim().slice(0, 40);
    },
  },
  {
    id: "unpinned-install",
    severity: "warning",
    message: "Unpinned install in CI — versions drift run-to-run (D1). Use the lockfile discipline (npm ci, frozen installs).",
    test(line) {
      if (/\bnpm\s+(i|install)\b(?!.*(?:ci|--frozen|--immutable))/i.test(line)) return "npm install";
      if (/\byarn\s+(add|install)\b/i.test(line) && !/--frozen-lockfile|--immutable/.test(line)) return "yarn install";
      if (/\bpip\s+install\b/i.test(line) && !/(-r\s+[^\s]*(?:lock|requirements\.txt)|--require-hashes|pip-compile)/i.test(line)) return "pip install";
      if (/\bgo\s+get\b/i.test(line) && !/go\s+mod\s+(download|verify)/i.test(line)) return "go get";
      return null;
    },
  },
  {
    id: "latest-tag",
    severity: "warning",
    message: "`:latest` image tag in a pipeline — 'latest' is a different image tomorrow (D2). Pin versions or digests.",
    test(line) {
      const m = /[\w./-]+:latest\b/i.exec(line);
      if (m) return m[0];
      // untagged reference — no tag IS latest: `image: app`, `FROM node`, `docker build -t app`
      const u = /\bimage\s*:\s*["']?[\w./-]+["']?\s*$/i.exec(line) || /^\s*FROM\s+[\w./-]+\s*$/i.exec(line) || /\s-t\s+["']?[\w./-]+["']?\s*$/i.exec(line);
      if (u) return `${u[0].trim()} (untagged = latest)`;
      return null;
    },
  },
  {
    id: "force-flag",
    severity: "warning",
    message: "Force flag on a push/publish/destructive operation — the flag exists to override guards (H1-adjacent).",
    test(line) {
      const m = /\b(git\s+push|npm\s+publish|docker\s+push|helm\s+upgrade|kubectl\s+apply)\b[^|]*\s--?f(orce)?\b/i.exec(line);
      return m ? m[0].trim() : null;
    },
  },
  {
    id: "destructive-op",
    severity: "warning",
    message: "Destructive operation in a pipeline without a visible approval/recovery reference (I2). Guard it, log it, make it reversible.",
    test(line) {
      const m = /\b(rm\s+-rf|kubectl\s+delete|terraform\s+destroy|helm\s+uninstall|\bDROP\s+TABLE)\b/i.exec(line);
      if (!m) return null;
      if (/(approval|manual|review|rollback|revert|restore|backup)/i.test(line)) return null;
      return m[0].trim();
    },
  },
];

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function walk(dir, acc = []) {
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
    if (st.isDirectory()) walk(p, acc);
    else if (st.isFile()) acc.push(p);
  }
  return acc;
}

function collect(paths) {
  const all = [];
  for (const p of paths) {
    const abs = resolve(p);
    let st;
    try {
      st = statSync(abs);
    } catch {
      console.error(`shipcraft: cannot read ${p}`);
      process.exit(2);
    }
    if (st.isDirectory()) walk(abs, all);
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
  const lines = text.split("\n");
  const retryLines = [];

  lines.forEach((raw, i) => {
    const rm = /\b(retry|retries|attempts|max_attempts)\s*:\s*[2-9]\d*\b/i.exec(raw);
    if (rm) retryLines.push({ line: i + 1, detail: `${rm[1]}: ${rm[0].match(/\d+/)[0]}` });
    for (const rule of rules) {
      const detail = rule.test(raw);
      if (detail) {
        findings.push({ file: basename(file), line: i + 1, rule: rule.id, severity: rule.severity, message: rule.message, detail });
      }
    }
  });

  // File-level: pipeline retries around test/check steps (context-aware)
  if (retryLines.length && /\b(test|check|verify)\b/i.test(text)) {
    findings.push({
      file: basename(file), line: retryLines[0].line, rule: "pipeline-retry", severity: "warning",
      message: "Pipeline-level retry around test/check steps — the flake still exists, now slower (H3). Root-cause it (autom).",
      detail: retryLines[0].detail,
    });
  }

  // File-level: deploy semantics without any rollback reference
  const deployish = /\b(deploy:|deploy\s|release:|publish|helm\s+upgrade|kubectl\s+apply|terraform\s+apply|aws\s+deploy|gh\s+release|releases\/create)\b/i.test(text);
  const recoveryish = /\b(rollback|revert|restore|previous[_-]?(image|version|digest)|undo)\b/i.test(text);
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
