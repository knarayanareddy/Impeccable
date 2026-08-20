#!/usr/bin/env node
/**
 * Codecraft deterministic checker.
 *
 * Scans source files for the code-slop anti-patterns in
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

const EXTS = new Set([
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx",
  ".py", ".go", ".java", ".rb", ".php",
  ".c", ".h", ".cc", ".cpp", ".cs", ".rs", ".swift", ".kt", ".kts",
  ".vue", ".svelte",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage", "target",
  ".next", ".nuxt", ".output", "vendor", ".venv", "__pycache__",
]);

const JS = (e) => /\.(js|mjs|cjs|jsx|ts|tsx|vue|svelte)$/.test(e);
const TS = (e) => /\.(ts|tsx)$/.test(e);

// ---------------------------------------------------------------------------
// Rules. Each rule: { id, severity, applies(ext), test(line) -> detail|null }
// ---------------------------------------------------------------------------

const MAGIC_WHITELIST = new Set([
  "0", "1", "2", "-1", "3", "4", "8", "10", "16", "24", "32", "60", "64",
  "100", "128", "255", "256", "360", "365", "500", "512", "1000", "1024",
  "2048", "4096", "8192", "10000", "65535", "86400", "3600",
]);

const rules = [
  {
    id: "magic-number",
    severity: "warning",
    message: "Magic number in logic. Name it with the reason in the name (anti-patterns.md V1).",
    test(line) {
      if (/^\s*(import|export|require|from)\s/i.test(line)) return null;
      const isDecl = /^\s*(const|let|var|static|final|readonly|def|#define|enum)\s/.test(line);
      for (const m of line.matchAll(/\b([1-9]\d{1,4})\b/g)) {
        const num = m[1];
        if (MAGIC_WHITELIST.has(num)) continue;
        const before = line.slice(0, m.index);
        // A bare declaration RHS is a named constant — that's the fix, not the smell
        const eq = before.lastIndexOf("=");
        if (isDecl && eq !== -1 && /^\s*$/.test(before.slice(eq + 1))) continue;
        if (/[=<>!+\-*/%([,?:&|]\s*$/.test(before.trimEnd()) || /^\s*(return|case|if|while|for)\b/i.test(before)) {
          return num;
        }
      }
      return null;
    },
  },
  {
    id: "swallowed-error",
    severity: "error",
    message: "Swallowed exception — the failure path is silent (anti-patterns.md E1).",
    test(line) {
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) return "catch {}";
      if (/except[^:]*:\s*pass\s*(#.*)?$/.test(line)) return "except: pass";
      if (/catch\s*\([^)]*\)\s*\{\s*\/\/\s*ignore/i.test(line)) return "catch ignored";
      return null;
    },
  },
  {
    id: "debug-statement",
    severity: "error",
    message: "Debug statement left in — route through the project's logger or delete (anti-patterns.md H1).",
    test(line) {
      const m = /console\.(log|debug|info|trace)\s*\(/.exec(line) ||
        /\bdebugger\s*[;]?/.exec(line) ||
        /(^|[^\w.])\bprint\s*\(/.exec(line) ||
        /\bbreakpoint\s*\(/.exec(line) ||
        /\bvar_dump\s*\(|\bprint_r\s*\(/.exec(line) ||
        /\bfmt\.Print(ln|f)?\s*\(/.exec(line);
      if (!m) return null;
      if (/console\.(log|debug|info|trace)/.test(line)) return m[0].replace(/\s*\(.*/, "(");
      return m[0].trim().replace(/\s*\(.*/, "(");
    },
  },
  {
    id: "ts-any",
    severity: "warning",
    applies: TS,
    message: "`any` erases the type system. Use `unknown` + narrowing or the real type (anti-patterns.md V4).",
    test(line) {
      const m = /:\s*any\b|as\s+any\b|<any>/.exec(line);
      return m ? m[0].trim() : null;
    },
  },
  {
    id: "suppression",
    severity: "warning",
    message: "Suppression without a stated reason. Fix the code or name the rule + reason (quality-floor.md #10).",
    test(line) {
      const m = /@ts-ignore|@ts-nocheck|eslint-disable|noqa|#\s*type:\s*ignore|nolint|@SuppressWarnings/.exec(line);
      if (!m) return null;
      // Has a reason comment (text after the directive beyond the rule name)?
      const after = line.slice(m.index + m[0].length).replace(/^[A-Za-z0-9\-/,\s]+/, "");
      if (after.trim().length > 8) return null;
      return m[0];
    },
  },
  {
    id: "loose-equality",
    severity: "warning",
    applies: JS,
    message: "Loose equality in JS/TS — type coercion bugs with zero upside. Use === (anti-patterns.md H3).",
    test(line) {
      if (/[^=!<>]==(?!=)|[^=!<>]!=(?!=)/.test(line.replace(/=>/g, "  "))) return "== / !=";
      return null;
    },
  },
  {
    id: "legacy-var",
    severity: "warning",
    applies: JS,
    message: "`var` in modern JavaScript — hoisting/scoping footguns. Use const/let (anti-patterns.md H4).",
    test(line) {
      return /\bvar\s+[A-Za-z_$]/.test(line) ? "var" : null;
    },
  },
  {
    id: "commented-out-code",
    severity: "warning",
    message: "Commented-out code — git remembers, the file must not (anti-patterns.md C2).",
    test(line) {
      const m = /^\s*(\/\/|#|<!--)\s?(.*)$/.exec(line);
      if (!m) return null;
      const s = m[2].trim();
      if (!s) return null;
      const codeStart = /^(const|let|var|function|def|class|import|export|if|for|while|return|public|private|func|fn|void|int|type|static)\b/.test(s);
      const codeShape = /[;{}]$/.test(s) || /[=(\[]/.test(s);
      if (codeStart && (codeShape || /^return\b/.test(s))) return s.slice(0, 100);
      return null;
    },
  },
  {
    id: "vague-name",
    severity: "warning",
    message: "Vague name in a signature (data/info/tmp/result/obj/item/thing). Name the role (anti-patterns.md N1).",
    test(line) {
      if (!/(function|def|func|fn)\s/i.test(line)) return null;
      const p = /\([^)]*\b(data|info|tmp|temp|result|obj|thing|item)\b[^)]*\)/.exec(line);
      if (p) return `parameter "${p[1]}"`;
      const n = /\b(function|def|func|fn)\s+(\w+)/i.exec(line);
      if (n && /^(handle|process|doThing|doStuff|foo|bar|baz|getData|processData)$/i.test(n[2])) return `function ${n[2]}`;
      return null;
    },
  },
];

const TODO_RE = /\b(TODO|FIXME|HACK|XXX)\b/g;

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
      console.error(`codecraft: cannot read ${p}`);
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

// Strip string literals (crude, per-line) so rules don't fire inside strings.
function stripStrings(line) {
  return line
    .replace(/`[^`]*`/g, "``")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
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
  let todos = 0;

  // Dominant indent unit: tabs=1 level, else gcd of positive indents clamped to {2,4}
  const indentUnit = (() => {
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    let unit = 0;
    let hasTabs = false;
    for (const raw of lines.slice(0, 300)) {
      const ws = raw.match(/^\s*/)[0];
      if (!ws || !raw.trim()) continue;
      if (ws.includes("\t")) {
        hasTabs = true;
        continue;
      }
      unit = unit === 0 ? ws.length : gcd(unit, ws.length);
    }
    if (hasTabs && unit === 0) return "tab";
    if (unit < 3) return 2;
    return unit % 2 === 0 ? 4 : 2;
  })();

  let pendingExcept = -1; // python: line index of a lone `except:` awaiting `pass`
  let lastDeepLine = -2; // dedupe consecutive deep-nesting lines (one finding per block)

  lines.forEach((raw, i) => {
    const line = stripStrings(raw);
    todos += (line.match(TODO_RE) || []).length;
    for (const rule of rules) {
      if (rule.applies && !rule.applies(ext)) continue;
      const detail = rule.test(line);
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

    // Deep nesting (file-aware indent unit); report the first line of each deep block
    const ws = raw.match(/^\s*/)[0];
    if (ws && raw.trim() && !/^\s*(\/\/|#|<!--)/.test(raw)) {
      const levels = indentUnit === "tab" ? ws.length : Math.floor(ws.length / indentUnit);
      if (levels >= 5) {
        if (i !== lastDeepLine + 1) {
          findings.push({
            file: basename(file),
            line: i + 1,
            rule: "deep-nesting",
            severity: "warning",
            message: "Indentation ≥5 levels — nesting depth likely >4 (quality-floor.md #3). Flatten it.",
            detail: `${levels} levels`,
          });
        }
        lastDeepLine = i;
      } else {
        lastDeepLine = -2;
      }
    }

    // Python multiline swallowed exception: `except:` on one line, `pass` on the next
    if (ext === ".py") {
      if (pendingExcept !== -1) {
        if (/^\s*pass\s*(#.*)?$/.test(line)) {
          findings.push({
            file: basename(file),
            line: pendingExcept + 1,
            rule: "swallowed-error",
            severity: "error",
            message: "Swallowed exception — the failure path is silent (anti-patterns.md E1).",
            detail: "except: pass",
          });
          pendingExcept = -1;
        } else if (line.trim() !== "") {
          pendingExcept = -1;
        }
      }
      if (/^\s*except[^:]*:\s*(#.*)?$/.test(line)) pendingExcept = i;
    }
  });

  if (lines.length > 600) {
    findings.push({
      file: basename(file),
      line: 1,
      rule: "long-file",
      severity: "warning",
      message: "File over 600 lines — split by responsibility (quality-floor.md #10).",
      detail: `${lines.length} lines`,
    });
  }
  if (todos >= 5) {
    findings.push({
      file: basename(file),
      line: 1,
      rule: "todo-sprawl",
      severity: "warning",
      message: "TODO/FIXME sprawl — the design is unfinished, not the code (anti-patterns.md C5).",
      detail: `${todos} markers`,
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
    console.error("codecraft: no matching source files found");
    process.exit(2);
  }

  const all = [];
  for (const f of files) {
    for (const fnd of scan(f)) {
      all.push({ ...fnd, path: relative(process.cwd(), f) });
    }
  }

  const errors = all.filter((f) => f.severity === "error");
  const warnings = all.filter((f) => f.severity === "warning");
  const failed = errors.length + (strict ? warnings.length : 0);

  if (json) {
    console.log(JSON.stringify({ files: files.length, errors, warnings, failed }, null, 2));
  } else {
    const sev = (s) => (s === "error" ? "\x1b[31mERROR\x1b[0m" : "\x1b[33mWARN \x1b[0m");
    for (const f of all) {
      console.log(`${sev(f.severity)} ${f.rule.padEnd(18)} ${f.path}:${f.line}  ${f.message}`);
      if (f.detail && !f.message.includes(f.detail)) console.log(`        · ${f.detail}`);
    }
    console.log(
      `\ncodecraft: ${files.length} file(s) scanned · ${errors.length} error(s), ${warnings.length} warning(s)` +
        (strict ? " (--strict: warnings fail)" : "") +
        (failed ? " · FAILED" : warnings.length ? " · warnings only (run with --strict to fail)" : " · clean ✓")
    );
  }
  process.exit(failed ? 1 : 0);
}

main();
