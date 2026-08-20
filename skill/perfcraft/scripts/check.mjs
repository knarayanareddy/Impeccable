#!/usr/bin/env node
/**
 * Perfcraft deterministic checker.
 *
 * Scans source files for the perf-slop anti-patterns in
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
const HTML_EXTS = new Set([".html", ".htm", ".mdx", ".vue", ".svelte"]);
const IMG_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const EXTS = new Set([...CODE_EXTS, ...HTML_EXTS]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage", "target",
  ".next", ".nuxt", ".output", "vendor", ".venv", "__pycache__",
]);

// A "query call" in the broad sense: per-item data/network fetch
const QUERY_RE = /\b(?:await\s+)?(?:\w*[Qq]uery(?:\.\w+)?\s*\(|\bfind(?:One|All|By\w*)?\s*\(|\bexec\s*\(|\bfetch\s*\(|axios[.\w]*\s*\(|\bpool\.\w+\s*\(|\bconn\.\w+\s*\(|\bexecute\s*\()/;
const LOOP_RE = /\b(for|while)\b|\.(?:forEach|map|filter|reduce)\s*\(/;
const BATCH_RE = /Promise\.all|Promise\.allSettled|\bIN\s*\(\s*[:?]|\bjoin\b|\beager/i;

// ---------------------------------------------------------------------------
// Line rules
// ---------------------------------------------------------------------------

const rules = [
  {
    id: "sync-io",
    severity: "error",
    message: "Synchronous I/O call — one blocked worker per request (B1). Use the async form; never in a request path.",
    test(line) {
      const m = /\b(?:fs\.)?(?:readFileSync|writeFileSync|existsSync|mkdirSync|rmSync|unlinkSync)\s*\(|\b(?:execSync|spawnSync|child_process\.execSync)\s*\(/i.exec(line);
      return m ? m[0].trim().replace(/\s*\(.*/, "(") : null;
    },
  },
  {
    id: "select-star",
    severity: "warning",
    message: "SELECT * in application code — bytes and parsing nobody needs (Q3). Project the columns.",
    test(line) {
      return /\bselect\s+\*\s+from\b/i.test(line) ? "SELECT *" : null;
    },
  },
  {
    id: "unbounded-load",
    severity: "warning",
    message: "Unbounded data load — no limit/take/projection on the same line (Q4). Bound it, or filter in the engine.",
    test(line) {
      if (/\bfindAll\s*\(|\bfetchAll\s*\(|\.find\s*\(\s*\)/.test(line)) return "unbounded query";
      if (/\.find\s*\(/.test(line) && !/\b(limit|take|first|top|where|findBy)\b/i.test(line)) return ".find() without limit/filter";
      return null;
    },
  },
  {
    id: "busy-retry",
    severity: "error",
    message: "Busy retry loop — a spin loop against the network (B4). Backoff + jitter + max attempts, or waitFor(state).",
    test(line) {
      if (/\bwhile\s*\(\s*(?:true|1)\s*\)/.test(line) && !/\b(sleep|wait|setTimeout|backoff|delay)\b/i.test(line)) {
        return "while (true) without backoff";
      }
      return null;
    },
  },
  {
    id: "dom-thrash",
    severity: "warning",
    message: "`innerHTML +=` in DOM code — re-parse + reflow per iteration (B3). Build once, insert once.",
    test(line) {
      return /\.innerHTML\s*\+=/.test(line) ? "innerHTML +=" : null;
    },
  },
  {
    id: "deep-clone",
    severity: "warning",
    message: "Deep clone via JSON round-trip — allocation storm in hot paths (M1). Structural sharing, or clone only what changes.",
    test(line) {
      return /JSON\.parse\(\s*JSON\.stringify\s*\(/.test(line) ? "JSON.parse(JSON.stringify(...))" : null;
    },
  },
  {
    id: "retry-storm",
    severity: "warning",
    message: "Retry without jitter — every failure becomes a thundering herd (P2). Backoff with full jitter.",
    test(line) {
      const m = /\bretry\s*\(|\bretries?\s*[:=]\s*\d|setTimeout\(\s*\w+\s*,\s*\d+\s*\)\s*;\s*\/\*\s*retry/i.exec(line);
      if (m && !/\b(jitter|random)\b/i.test(line)) return "retry without jitter";
      return null;
    },
  },
];

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function walk(dir, acc = { code: [], images: [], all: [] }) {
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
      walk(p, acc);
      continue;
    }
    if (!st.isFile()) continue;
    acc.all.push({ p, size: st.size });
    const ext = extname(name).toLowerCase();
    if (EXTS.has(ext)) acc.code.push(p);
    else if (IMG_EXTS.has(ext)) acc.images.push({ p, size: st.size });
  }
  return acc;
}

function collect(paths) {
  const acc = { code: [], images: [], all: [] };
  for (const p of paths) {
    const abs = resolve(p);
    let st;
    try {
      st = statSync(abs);
    } catch {
      console.error(`perfcraft: cannot read ${p}`);
      process.exit(2);
    }
    if (st.isDirectory()) walk(abs, acc);
    else {
      const ext = extname(abs).toLowerCase();
      if (EXTS.has(ext)) acc.code.push(abs);
      else if (IMG_EXTS.has(ext)) acc.images.push({ p: abs, size: st.size });
      acc.all.push({ p: abs, size: st.size });
    }
  }
  acc.code = [...new Set(acc.code)];
  return acc;
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

function prevHas(lines, i, re, n) {
  for (let j = Math.max(0, i - n); j < i; j++) {
    if (re.test(lines[j])) return true;
  }
  return false;
}

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
      const detail = rule.test(raw);
      if (detail) {
        findings.push({ file: basename(file), line: i + 1, rule: rule.id, severity: rule.severity, message: rule.message, detail });
      }
    }

    // N+1: a query call on this line, with a loop on this line or within the previous 3,
    // and no batch pattern (Promise.all / IN / join).
    if (QUERY_RE.test(raw) && !BATCH_RE.test(raw)) {
      if (LOOP_RE.test(raw) || prevHas(lines, i, LOOP_RE, 3)) {
        findings.push({
          file: basename(file), line: i + 1, rule: "n-plus-one", severity: "warning",
          message: "Possible N+1 — per-item query inside a loop (Q1). Batch with IN(...)/join/Promise.all.",
          detail: "loop + per-item query",
        });
      }
    }

    // Layout read in a loop (same line or within the previous 3 lines) — forced reflow (B3)
    const layoutRead = /\b(?:getBoundingClientRect|offsetHeight|offsetWidth|offsetTop|offsetLeft|scrollHeight|scrollWidth|clientHeight|clientWidth)\s*\(/.exec(raw);
    if (layoutRead && (LOOP_RE.test(raw) || prevHas(lines, i, LOOP_RE, 3))) {
      findings.push({
        file: basename(file), line: i + 1, rule: "layout-thrash", severity: "warning",
        message: "Layout read inside a loop — forced reflow per iteration (B3). Batch reads, then writes.",
        detail: layoutRead[0].trim().replace(/\s*\(.*/, "("),
      });
    }

    // String concat in a loop: `x +=` with a for/while within the previous 3 lines
    if (/^\s*[a-zA-Z_$][\w$]*\s*\+=\s*[^=]/.test(raw) && prevHas(lines, i, /\b(for|while)\b/, 3)) {
      findings.push({
        file: basename(file), line: i + 1, rule: "string-concat-loop", severity: "warning",
        message: "String concatenation inside a loop — O(n²) building (Q5). Use a builder/join.",
        detail: "+= in loop",
      });
    }
  });

  // img without lazy loading / dimensions (HTML-ish files)
  if (HTML_EXTS.has(ext)) {
    lines.forEach((raw, i) => {
      if (/<img\b/i.test(raw) && !/\bloading\s*=/i.test(raw)) {
        findings.push({
          file: basename(file), line: i + 1, rule: "img-no-lazy", severity: "warning",
          message: "<img> without loading= — below-the-fold images should lazy-load; always reserve width/height (D1).",
          detail: "add loading=\"lazy\" + width/height",
        });
      }
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

  const { code, images, all } = collect(targets);
  if (!all.length) {
    console.error("perfcraft: no files found");
    process.exit(2);
  }

  const findings = [];
  for (const f of code) {
    for (const fnd of scan(f)) {
      findings.push({ ...fnd, path: relative(process.cwd(), f) });
    }
  }

  // Heavy images (size-based, no content parsing)
  for (const img of images) {
    if (img.size > 2 * 1024 * 1024) {
      findings.push({
        file: basename(img.p), line: 0, rule: "heavy-asset", severity: "error",
        message: `Image over 2MB (${(img.size / 1024 / 1024).toFixed(1)}MB) — the #1 payload cost (D1).`,
        detail: "resize + right format (AVIF/WebP) + srcset",
        path: relative(process.cwd(), img.p),
      });
    } else if (img.size > 1024 * 1024) {
      findings.push({
        file: basename(img.p), line: 0, rule: "heavy-asset", severity: "warning",
        message: `Image over 1MB (${(img.size / 1024 / 1024).toFixed(1)}MB) — likely oversized for delivery (D1).`,
        detail: "resize + right format (AVIF/WebP) + srcset",
        path: relative(process.cwd(), img.p),
      });
    }
  }

  // Project-level: no performance budget/gate config anywhere
  const hasGate = all.some(({ p }) => /\b(lighthouse|budget|webperf|perf(?:ormance)?)\b/i.test(basename(p)) && /\.(json|js|mjs|cjs|ts|yml|yaml)$/i.test(p));
  if (!hasGate) {
    findings.push({
      file: "(project)", line: 0, rule: "no-budget-gate", severity: "warning",
      message: "No performance budget/gate config found — un-gated performance rots (D3).",
      detail: "add a budget file + CI regression gate (see /perfcraft budget)",
      path: ".",
    });
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const failed = errors.length + (strict ? warnings.length : 0);

  if (json) {
    console.log(JSON.stringify({ files: all.length, errors, warnings, failed }, null, 2));
  } else {
    const sev = (s) => (s === "error" ? "\x1b[31mERROR\x1b[0m" : "\x1b[33mWARN \x1b[0m");
    for (const f of findings) {
      console.log(`${sev(f.severity)} ${f.rule.padEnd(20)} ${f.path}:${f.line}  ${f.message}`);
      if (f.detail && !f.message.includes(f.detail)) console.log(`        · ${f.detail}`);
    }
    console.log(
      `\nperfcraft: ${all.length} file(s) scanned · ${errors.length} error(s), ${warnings.length} warning(s)` +
        (strict ? " (--strict: warnings fail)" : "") +
        (failed ? " · FAILED" : warnings.length ? " · warnings only (run with --strict to fail)" : " · clean ✓")
    );
  }
  process.exit(failed ? 1 : 0);
}

main();
