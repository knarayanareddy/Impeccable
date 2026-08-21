#!/usr/bin/env node
/**
 * Obscraft deterministic checker.
 *
 * Scans source and config files for the observability-slop anti-patterns in
 * reference/anti-patterns.md. Zero dependencies, no LLM, no API key.
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

const CODE_EXTS = new Set([
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx",
  ".py", ".go", ".java", ".rb", ".php",
  ".cs", ".rs", ".swift", ".kt", ".kts",
]);
const CFG_EXTS = new Set([".yaml", ".yml", ".json", ".toml"]);
const EXTS = new Set([...CODE_EXTS, ...CFG_EXTS]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage", "target",
  ".next", ".nuxt", ".output", "vendor", ".venv", "__pycache__",
]);

const SENSITIVE_FIELDS = /\b(password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|token|apiToken|accessToken|authToken|sessionToken|privateKey|bearer|authorization|cookie|jwt|credential)\b/i;
const PII_FIELDS = /\b(email|ssn|social[_-]?security|passport|credit[_-]?card|card[_-]?number|phone[_-]?number|cvv)\b/i;
const LOG_CALL = /(console\.(log|info|warn|error|debug)|logger\.\w+|log\.\w+|logrus\.\w+|println|print\s*\(|LOG\.\w+|log\.\w+\()/;

// ---------------------------------------------------------------------------
// Line rules
// ---------------------------------------------------------------------------

const rules = [
  {
    id: "secret-in-log",
    severity: "error",
    message: "Secret field in a log statement — the log is a credential store unless you deny it the job (signal-floor #7). Redact at the source.",
    test(line) {
      if (!LOG_CALL.test(line)) return null;
      const m = SENSITIVE_FIELDS.exec(line);
      return m ? m[1] : null;
    },
  },
  {
    id: "pii-in-log",
    severity: "warning",
    message: "PII field in a log statement — raw PII never belongs in logs (signal-floor #7). Redact or pseudonymize.",
    test(line) {
      if (!LOG_CALL.test(line)) return null;
      if (/\b(redact|mask|hash|sanitize)\w*\s*\(/i.test(line)) return null; // redaction applied
      const m = PII_FIELDS.exec(line);
      return m ? m[1] : null;
    },
  },
  {
    id: "generic-error",
    severity: "warning",
    message: "Generic error message — the log says nothing; the engineer opens the code (L3). Operation + subject + outcome + error.",
    test(line) {
      const m = /(?:Something went wrong|An error occurred|Unknown error|Error happened|Unexpected error|Internal error)\b/i.exec(line);
      return m ? m[0] : null;
    },
  },
  {
    id: "string-concat-log",
    severity: "warning",
    message: "String-concatenated log message — every query becomes a parsing project (L4). Structured fields.",
    test(line) {
      if (!LOG_CALL.test(line)) return null;
      if (/\+/.test(line) && /["']/.test(line)) return "concatenated log message";
      return null;
    },
  },
  {
    id: "mean-only-metric",
    severity: "warning",
    message: "Mean/average as the latency metric — the tail is hidden, and the tail is the users (M1). Use P50/P95/P99.",
    test(line) {
      const m = /\.(?:mean|avg|average)\s*\(|\bavg\s*\(|\baverage\s*\(/i.exec(line);
      if (!m) return null;
      if (/\b(p95|p99|p50|percentile|quantile|histogram)\b/i.test(line)) return null; // percentiles present too
      return m[0].trim().replace(/\s*\(.*/, "(");
    },
  },
  {
    id: "metric-name-scatter",
    severity: "warning",
    message: "Metric name as a string literal — names become constants in one vocabulary (M2). Same string in 3+ places = divergence risk.",
    test(line) {
      const m = /["']([a-z_]+(?:_total|_count|_duration|_seconds|_errors|_requests|_latency|_queue|_gauge|_in_flight|_histogram))["']/i.exec(line);
      return m ? m[1] : null;
    },
    fileLevel: true, // aggregated per file below
  },
  {
    id: "alert-no-owner",
    severity: "warning",
    message: "Alert defined without an owner/runbook reference — at 3 a.m. nobody knows what it means (A4).",
    test(line) {
      // Case-sensitive: real alert config keys are lowercase (alert:, receiver:, page:).
      // Case-insensitive matching false-positives on component names like `Page`.
      const alertCtx = /\b(alert|page|notify|notification|receiver|oncall|on_call)\b/.test(line) ||
        /^\s*-\s*(?:alert|page):/.test(line) || /^\s*(?:alert|page):/.test(line);
      if (!alertCtx) return null;
      if (/\b(owner|runbook|playbook|doc|wiki|#\d+|ticket|escalat)\w*\b/i.test(line)) return null;
      return "no owner/runbook";
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
    else if (st.isFile() && EXTS.has(extname(name).toLowerCase())) acc.push(p);
  }
  return acc;
}

function collect(paths) {
  const files = [];
  for (const p of paths) {
    const abs = resolve(p);
    let st;
    try {
      st = statSync(abs);
    } catch {
      console.error(`obscraft: cannot read ${p}`);
      process.exit(2);
    }
    if (st.isDirectory()) walk(abs, files);
    else if (EXTS.has(extname(abs).toLowerCase())) files.push(abs);
  }
  return [...new Set(files)];
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
  const ext = extname(file).toLowerCase();
  const isCode = CODE_EXTS.has(ext);
  const rawLines = text.split("\n");
  // Stateful comment stripping: comments are prose, not evidence. Windowed
  // checks (log-in-loop) read the stripped lines — "for" in a comment is prose.
  const lines = [];
  {
    let inBlock = false;
    for (const raw of rawLines) {
      let line = raw;
      if (inBlock) {
        const end = line.indexOf("*/");
        if (end === -1) { lines.push(""); continue; }
        line = " ".repeat(end + 2) + line.slice(end + 2);
        inBlock = false;
      }
      let out = "";
      let i = 0;
      while (i < line.length) {
        if (line.startsWith("/*", i)) {
          const end = line.indexOf("*/", i + 2);
          if (end === -1) { inBlock = true; break; }
          out += " ".repeat(end + 2 - i);
          i = end + 2;
        } else if (/\.(js|mjs|cjs|jsx|ts|tsx|vue|svelte)$/i.test(file) && line.startsWith("//", i) && (i === 0 || line[i - 1] !== ":")) {
          break;
        } else if (/\.(py|yaml|yml)$/i.test(file) && line.startsWith("#", i)) {
          break;
        } else if (/\.(html?|vue|svelte)$/i.test(file) && line.startsWith("<!--", i)) {
          const end = line.indexOf("-->", i + 4);
          out += " ".repeat(end === -1 ? line.length - i : end + 3 - i);
          i = end === -1 ? line.length : end + 3;
        } else {
          out += line[i];
          i += 1;
        }
      }
      lines.push(out);
    }
  }

  const metricNames = new Map(); // name -> line count
  const prevHas = (i, re, n) => {
    for (let j = Math.max(0, i - n); j < i; j++) if (re.test(lines[j])) return true;
    return false;
  };

  lines.forEach((raw, i) => {
    for (const rule of rules) {
      if (rule.id === "metric-name-scatter") {
        const m = rule.test(raw);
        if (m) metricNames.set(m, (metricNames.get(m) || 0) + 1);
        continue;
      }
      const detail = rule.test(raw);
      if (detail) {
        findings.push({ file: basename(file), line: i + 1, rule: rule.id, severity: rule.severity, message: rule.message, detail });
      }
    }

    // Log statement inside a loop (same line or within the previous 2) — a log storm (L5)
    if (LOG_CALL.test(raw) && (/\b(for|while)\b/.test(raw) || prevHas(i, /\b(for|while)\b/, 4))) {
      findings.push({
        file: basename(file), line: i + 1, rule: "log-in-loop", severity: "warning",
        message: "Log statement inside a loop — a log storm (L5). One aggregate line per batch.",
        detail: "log in loop",
      });
    }
  });

  // Metric-name scatter: same literal in 3+ places
  for (const [name, count] of metricNames) {
    if (count >= 3) {
      findings.push({
        file: basename(file), line: 1, rule: "metric-name-scatter", severity: "warning",
        message: `Metric name "${name}" appears ${count}× as string literals — one typo creates a divergent series (M2).`,
        detail: "define once as a constant",
      });
    }
  }

  // File-level (code): outgoing calls without correlation-ID propagation.
  // Frontend files (tsx/jsx) are exempt — the browser's propagation is the platform's job, not the page's.
  if (isCode && !/\.(tsx|jsx)$/i.test(file) && /\b(fetch|axios|http\.(get|post)|requests\.(get|post)|client\.\w+\()/.test(text)) {
    if (!/x-request-id|traceparent|trace_id|correlation[-_]?id/i.test(text)) {
      findings.push({
        file: basename(file), line: 1, rule: "no-correlation-propagation", severity: "warning",
        message: "Outgoing calls with no correlation-ID propagation — the trace dies at the boundary (T1).",
        detail: "propagate the trace/request ID on every hop",
      });
    }
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
    console.error("obscraft: no matching source files found");
    process.exit(2);
  }

  const findings = [];
  for (const f of files) {
    for (const fnd of scan(f)) {
      findings.push({ ...fnd, path: relative(process.cwd(), f) });
    }
  }

  // Project-level: no SLO/budget definition anywhere
  const hasSlo = files.some((f) => /\b(slo|error[_-]?budget|service[_-]?level|reliability)\b/i.test(basename(f)));
  const isProjectScope = targets.some((p) => { try { return statSync(resolve(p)).isDirectory(); } catch { return false; } }) || files.length > 1;
  if (!hasSlo && isProjectScope) {
    findings.push({
      file: "(project)", line: 0, rule: "no-slo-file", severity: "warning",
      message: "No SLO/error-budget definition found — 'working' has no definition until the outage (S1).",
      detail: "see /obscraft slo for the journey SLO",
      path: ".",
    });
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const failed = errors.length + (strict ? warnings.length : 0);

  if (json) {
    console.log(JSON.stringify({ files: files.length, errors, warnings, failed }, null, 2));
  } else {
    const sev = (s) => (s === "error" ? "\x1b[31mERROR\x1b[0m" : "\x1b[33mWARN \x1b[0m");
    for (const f of findings) {
      console.log(`${sev(f.severity)} ${f.rule.padEnd(26)} ${f.path}:${f.line}  ${f.message}`);
      if (f.detail && !f.message.includes(f.detail)) console.log(`        · ${f.detail}`);
    }
    console.log(
      `\nobscraft: ${files.length} file(s) scanned · ${errors.length} error(s), ${warnings.length} warning(s)` +
        (strict ? " (--strict: warnings fail)" : "") +
        (failed ? " · FAILED" : warnings.length ? " · warnings only (run with --strict to fail)" : " · clean ✓")
    );
  }
  process.exitCode = failed ? 1 : 0;
}

main();
