#!/usr/bin/env node
/**
 * Apicraft deterministic checker.
 *
 * Scans API source files (routes, controllers, handlers, specs) for the
 * API-slop anti-patterns in reference/anti-patterns.md.
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

const CODE_EXTS = new Set([
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx",
  ".py", ".go", ".java", ".rb", ".php",
  ".c", ".h", ".cc", ".cpp", ".cs", ".rs", ".swift", ".kt", ".kts",
  ".vue", ".svelte",
]);
const SPEC_EXTS = new Set([".yaml", ".yml", ".graphql", ".gql", ".proto"]);
const EXTS = new Set([...CODE_EXTS, ...SPEC_EXTS]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage", "target",
  ".next", ".nuxt", ".output", "vendor", ".venv", "__pycache__",
]);

// Quoted path strings: route definitions in code, paths: keys in specs
const PATH_RE = /(["'`])(\/[^"'`\s]+)(["'`])/g;

const ROUTE_VERBS = ["get", "set", "update", "delete", "remove", "create", "save"];
// Segment-aware: /verb followed by end-of-segment, hyphen, digit, uppercase, or a lowercase
// concatenation (getuser) — but NOT ordinary words that merely start with a verb prefix.
const VERB_SEG_RE = new RegExp(`/(${ROUTE_VERBS.join("|")})(?:$|[-_0-9A-Z]|[a-z]+$)`, "i");
const ORDINARY_WORDS = new Set(["settings", "setbacks"]);
const VERB_RE = new RegExp(`/(${ROUTE_VERBS.join("|")})(?=[A-Za-z0-9_-])`, "i");
const FINAL_VERB_RE = new RegExp(`/(${ROUTE_VERBS.join("|")})$`, "i");
const SIDE_EFFECT_RE = /(create|update|delete|remove|save|set)[A-Z_-]/;

// ---------------------------------------------------------------------------
// Line rules
// ---------------------------------------------------------------------------

const rules = [
  {
    id: "verb-in-url",
    severity: "error",
    message: "Verb in the URL — the HTTP method is the verb, the path names the resource (anti-patterns.md R1).",
    test(line) {
      for (const m of line.matchAll(PATH_RE)) {
        const p = m[2];
        const last = p.split("/").filter(Boolean).pop() || "";
        if (ORDINARY_WORDS.has(last.toLowerCase())) continue;
        if (VERB_RE.test(p)) return p;
        if (FINAL_VERB_RE.test(`/${last}`)) return p;
      }
      return null;
    },
  },
  {
    id: "get-with-side-effects",
    severity: "warning",
    message: "GET endpoint that appears to mutate (create/update/delete/remove/save/set in the path) — caches and retries will re-trigger it (R2).",
    test(line) {
      if (!/\.get\s*\(\s*["'`]|method:\s*["']GET["']|@get\b|@(?:Get|GetMapping)/i.test(line)) return null;
      for (const m of line.matchAll(PATH_RE)) {
        const p = m[2];
        if (SIDE_EFFECT_RE.test(p) || /\/(create|update|delete|remove|save)$/.test(p)) return p;
      }
      return null;
    },
  },
  {
    id: "success-wrapper",
    severity: "warning",
    message: "`{success: true}` / `{ok: true}` wrapper — the status code already says success; the wrapper invents a parallel truth that drifts (E3).",
    test(line) {
      if (!/\b(success|ok)\s*:\s*(true|false)\b/.test(line)) return null;
      if (/(res\.(?:json|send)\(|\.json\(\{|jsonify\(|response\s*[:=]|ctx\.body\s*=|body\s*[:=])/i.test(line)) {
        const m = /\b((?:success|ok))\s*:\s*(true|false)\b/i.exec(line);
        return `${m[1]}: ${m[2]}`;
      }
      return null;
    },
  },
  {
    id: "leaked-internals",
    severity: "error",
    message: "Stack trace / internals in a response — log server-side, return code + message + request_id (E5).",
    test(line) {
      const hasStack = /\b(err|error|e|exception)\.(stack|stacktrace)\b|\bstacktrace\b|\bSQLSTATE\b/i.test(line);
      if (!hasStack) return null;
      const inResponse = /(res\.(?:send|json|end|write)|jsonify\(|ctx\.body|writeHead|sendResponse|\.json\(\{)/i.test(line);
      return inResponse ? "internals in response body" : null;
    },
  },
  {
    id: "select-star",
    severity: "warning",
    message: "`SELECT *` without a limit in an API path — unbounded columns and rows (C1/C2). Select named columns with a LIMIT.",
    test(line) {
      return /\bselect\s+\*\s+from\b/i.test(line) ? line.trim().slice(0, 120) : null;
    },
  },
  {
    id: "no-retry-after",
    severity: "warning",
    message: "429 without Retry-After — rate limits without retry guidance are random failures (http.md).",
    test(line) {
      return /\b429\b/.test(line) && !/Retry-After/i.test(line) ? "429" : null;
    },
  },
  {
    id: "unbounded-page-size",
    severity: "warning",
    message: "Page size over 500 — cap it (100–500) and document the max (C2).",
    test(line) {
      const m = /(?:limit|pageSize|page_size|per_page|perPage|max_results|maxResults|size)\s*[:=]\s*(\d{3,})/.exec(line);
      if (!m) return null;
      const n = parseInt(m[1], 10);
      return n > 500 ? m[1] : null;
    },
  },
  {
    id: "hardcoded-credential",
    severity: "error",
    message: "Hardcoded credential in code — move to environment/config (contract-floor.md #8). Value redacted.",
    test(line) {
      const m = /((?:api[_-]?key|api[_-]?secret|secret[_-]?key|password|passwd|access[_-]?token|auth[_-]?token|bearer[_-]?token))\s*[:=]\s*["']([A-Za-z0-9_\-+./=]{8,})["']/i.exec(line);
      if (!m) return null;
      const key = m[1];
      const val = m[2];
      if (/^(changeme|password|secret|example|dummy|test|testing|x{8,}|12345678)$/i.test(val)) return null;
      if (/[<>]/.test(val)) return null;
      return `${key} = "<redacted>"`;
    },
    testFallback(line) {
      // env fallback form: `const key = process.env.KEY || "sk-..."` — the fallback IS a committed credential
      const m = /\b(api[_-]?key|api[_-]?secret|secret[_-]?key|password|passwd|access[_-]?token|auth[_-]?token|bearer[_-]?token)\b[^=]*=\s*[^;]*\|\|\s*["']([A-Za-z0-9_\-+./=]{8,})["']/i.exec(line);
      if (!m) return null;
      if (/^(changeme|password|secret|example|dummy|test|testing|x{8,}|12345678)$/i.test(m[2])) return null;
      return `${m[1]} ||= "<redacted>"`;
    },
  },
  {
    id: "date-as-string",
    severity: "warning",
    message: "Date field typed as a plain string — no format, no timezone. Use RFC 3339 + explicit timezone (P2).",
    test(line) {
      const m = /\b(date|Date|timestamp|Timestamp|createdAt|created_at|updatedAt|updated_at|expiresAt|expires_at|dueDate|due_date|deadline)\??\s*:\s*string\b/.exec(line);
      return m ? m[1] : null;
    },
  },
  {
    id: "deep-resource-nesting",
    severity: "warning",
    message: "Resource nesting deeper than 2 levels — flatten to a top-level endpoint with filters (R3).",
    test(line) {
      for (const m of line.matchAll(PATH_RE)) {
        const p = m[2];
        let segments = p.split("/").filter((s) => s && !/^v\d/i.test(s) && !/^[{:$].*[})]?$/.test(s));
        // A trailing verb segment (e.g. /users/delete) is a verb-in-url smell, not a resource level
        const last = segments[segments.length - 1] || "";
        if (FINAL_VERB_RE.test(`/${last}`)) segments = segments.slice(0, -1);
        if (segments.length >= 3) return p;
      }
      return null;
    },
  },
  {
    id: "minor-version-in-path",
    severity: "warning",
    message: "Semver in the URL path — major versions only in paths (/v1.1 is banned) (versioning.md).",
    test(line) {
      for (const m of line.matchAll(PATH_RE)) {
        if (/\/v\d+\.\d+/.test(m[2])) return m[2];
      }
      return null;
    },
  },
  {
    id: "empty-error-body",
    severity: "warning",
    message: "Error response with an empty body — the consumer can't react programmatically (E4).",
    test(line) {
      const m = /\.(?:status|code)\((\d{3})\)\.(?:json|send)\(\s*(\{\s*\}|["'][^"']{0,4}["'])?\s*\)/.exec(line);
      if (!m) return null;
      return /^[45]/.test(m[1]) ? `${m[1]} with empty body` : null;
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
    else if (st.isFile()) {
      const ext = extname(name).toLowerCase();
      if (CODE_EXTS.has(ext) || SPEC_EXTS.has(ext)) acc.push(p);
      else if (ext === ".json" && /(openapi|swagger|schema|api)/i.test(basename(name))) acc.push(p);
    }
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
      console.error(`apicraft: cannot read ${p}`);
      process.exit(2);
    }
    if (st.isDirectory()) walk(abs, files);
    else if (EXTS.has(extname(abs).toLowerCase())) files.push(abs);
    else if (extname(abs).toLowerCase() === ".json" && /(openapi|swagger|schema|api)/i.test(basename(abs))) files.push(abs);
  }
  return [...new Set(files)];
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

const CODE_ONLY = (ext) => CODE_EXTS.has(ext);

function scan(file) {
  const findings = [];
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return findings;
  }
  const ext = extname(file).toLowerCase();
  const lines = text.split("\n");

  lines.forEach((raw, i) => {
    for (const rule of rules) {
      const detail = rule.test(raw) || (rule.testFallback ? rule.testFallback(raw) : null);
      if (detail) {
        findings.push({
          file: basename(file),
          line: i + 1,
          rule: rule.id,
          severity: rule.severity,
          message: rule.message,
          detail,
        });
      }
    }
  });

  // Spec-lint block pass: each operation must declare responses + operationId
  if (SPEC_EXTS.has(ext)) {
    const opRe = /^\s{2,8}(get|post|put|patch|delete):\s*$/gm;
    const positions = [];
    let op;
    while ((op = opRe.exec(text))) {
      positions.push({ index: op.index, method: op[1], line: text.slice(0, op.index).split("\n").length });
    }
    positions.forEach((pos, i) => {
      const block = text.slice(pos.index, i + 1 < positions.length ? positions[i + 1].index : text.length);
      if (!/responses\s*:/.test(block)) {
        findings.push({ file: basename(file), line: pos.line, rule: "spec-missing-responses", severity: "warning",
          message: "OpenAPI operation with no responses block — the contract can't state its outcomes (specs.md).",
          detail: pos.method + ":" });
      }
      if (!/operationId\s*:/.test(block)) {
        findings.push({ file: basename(file), line: pos.line, rule: "spec-missing-operationid", severity: "warning",
          message: "OpenAPI operation without operationId — SDK generation and traceability need it (specs.md).",
          detail: pos.method + ":" });
      }
    });
  }

  // File-level: unversioned /api/ endpoints (code files only)
  if (CODE_ONLY(ext)) {
    const unversioned = [];
    for (const m of text.matchAll(PATH_RE)) {
      const p = m[2];
      if (/\/api\//i.test(p) && !/\/v\d+/.test(p)) unversioned.push(p);
    }
    if (unversioned.length) {
      findings.push({
        file: basename(file),
        line: 1,
        rule: "unversioned-api",
        severity: "warning",
        message: "Unversioned /api/ endpoint — the day a breaking change is needed, there is nowhere to go (R5).",
        detail: unversioned.length === 1 ? unversioned[0] : `${unversioned.length} unversioned paths (e.g. ${unversioned[0]})`,
      });
    }
  }

  // File-level: mixed field casing in the same file. Code files only — OpenAPI/GraphQL
  // spec keys (operationId, requestBody) are schema vocabulary, not payload casing.
  const snake = CODE_ONLY(ext) ? (text.match(/\b[a-z][a-z0-9]+_[a-z0-9_]+\s*:/g) || []).length : 0;
  const camel = CODE_ONLY(ext) ? (text.match(/\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\s*:/g) || []).length : 0;
  if (snake >= 2 && camel >= 2) {
    findings.push({
      file: basename(file),
      line: 1,
      rule: "mixed-field-casing",
      severity: "warning",
      message: "Mixed field casing in one file — pick one convention app-wide (P4). If this is a deliberate mapping boundary, document it.",
      detail: `${snake} snake_case, ${camel} camelCase keys`,
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
    console.error("apicraft: no matching API source files found");
    process.exit(2);
  }

  const all = [];
  for (const f of files) {
    for (const fnd of scan(f)) {
      all.push({ ...fnd, path: relative(process.cwd(), f) });
    }
  }

  // Project-level: no machine-readable contract anywhere.
  // Emit only for project-scope scans (a directory or multiple files) — a single-file
  // targeted scan is focused work, not a project claim.
  const hasSpec = files.some(
    (f) => SPEC_EXTS.has(extname(f).toLowerCase()) || /(openapi|swagger|api[-_]?spec)/i.test(basename(f))
  );
  const isProjectScope = targets.some((p) => { try { return statSync(resolve(p)).isDirectory(); } catch { return false; } }) || files.length > 1;
  if (!hasSpec && isProjectScope) {
    all.push({
      file: "(project)",
      line: 0,
      rule: "no-spec-file",
      severity: "warning",
      message: "No machine-readable API contract found (OpenAPI/GraphQL/proto) — nothing to diff, test, or generate SDKs from (L1).",
      detail: "add one and wire the CI spec-diff",
      path: ".",
    });
  }

  const errors = all.filter((f) => f.severity === "error");
  const warnings = all.filter((f) => f.severity === "warning");
  const failed = errors.length + (strict ? warnings.length : 0);

  if (json) {
    console.log(JSON.stringify({ files: files.length, errors, warnings, failed }, null, 2));
  } else {
    const sev = (s) => (s === "error" ? "\x1b[31mERROR\x1b[0m" : "\x1b[33mWARN \x1b[0m");
    for (const f of all) {
      console.log(`${sev(f.severity)} ${f.rule.padEnd(22)} ${f.path}:${f.line}  ${f.message}`);
      if (f.detail && !f.message.includes(f.detail)) console.log(`        · ${f.detail}`);
    }
    console.log(
      `\napicraft: ${files.length} file(s) scanned · ${errors.length} error(s), ${warnings.length} warning(s)` +
        (strict ? " (--strict: warnings fail)" : "") +
        (failed ? " · FAILED" : warnings.length ? " · warnings only (run with --strict to fail)" : " · clean ✓")
    );
  }
  process.exit(failed ? 1 : 0);
}

main();
