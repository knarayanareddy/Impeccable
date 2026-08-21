#!/usr/bin/env node
/**
 * Bugcraft deterministic checker.
 *
 * Scans source files for the debugging-slop anti-patterns in
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
  ".cs", ".rs", ".swift", ".kt", ".kts",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage", "target",
  ".next", ".nuxt", ".output", "vendor", ".venv", "__pycache__",
]);

// Debug marker: the "here"/"xxx"/"debug" family — literal evidence of print-debugging
const DEBUG_MARKER = /(?:console\.(log|debug|info)\s*\(\s*["'](?:here|here[0-9]*|xxx+|debug|debugging|test[0-9]*|wat|why|asdf|foo|bar|hello|there|print me)["']|debugger\s*;|print\s*\(\s*["'](?:here|xxx+|DEBUG|debug|HERE)["'])/i;

const UNCERTAINTY = /\b(?:hack|workaround|temporary fix|temp fix|don'?t (?:touch|change|ask)|why does this work|works on my machine|magic|voodoo|kludge|because reasons|idk|i don'?t know why)\b/i;

// ---------------------------------------------------------------------------
// Line rules
// ---------------------------------------------------------------------------

const rules = [
  {
    id: "debug-marker",
    severity: "error",
    message: "Debug marker shipped — print-debugging left in the crime scene (S4). Clean before merge.",
    test(line) {
      const m = DEBUG_MARKER.exec(line);
      if (!m) return null;
      const dbg = /\bdebugger\s*;/.exec(line);
      if (dbg) return "debugger;";
      return m[0].trim().slice(0, 40);
    },
  },
  {
    id: "log-and-swallow",
    severity: "error",
    message: "Log-and-swallow — the error is printed and dropped (S2). Handle, translate, or propagate it.",
    test(line) {
      const m = /catch\s*\([^)]*\)\s*\{\s*console\.(log|error|warn|debug)\s*\([^)]*\)\s*;?\s*\}/i.exec(line);
      if (m) return "catch { console.log(err) }";
      const py = /except[^:]*:\s*print\s*\([^)]*\)\s*(#.*)?$/i.exec(line);
      if (py) return "except: print(e)";
      return null;
    },
  },
  {
    id: "swallowed-exception",
    severity: "error",
    message: "Swallowed exception — the error is deleted before anyone reads it (S1). Handle, translate, or propagate.",
    test(line) {
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) return "catch {}";
      if (/except[^:]*:\s*pass\s*(#.*)?$/.test(line)) return "except: pass";
      return null;
    },
  },
  {
    id: "silent-catch-return",
    severity: "warning",
    message: "Silent return from catch — failure becomes indistinguishable from 'no result' (S3). Use result types or rethrow with context.",
    test(line) {
      const m = /catch\s*\([^)]*\)\s*\{\s*return\s+(?:null|undefined|-1|false)\s*;?\s*\}/i.exec(line);
      if (m) return "catch { return null }";
      const py = /except[^:]*:\s*return\s+(?:None|-1|False)\s*(#.*)?$/i.exec(line);
      if (py) return "except: return None";
      return null;
    },
  },
  {
    id: "disabled-code",
    severity: "warning",
    message: "Disabled code block — a shipped experiment (S5). Delete it; git remembers.",
    // subject: the STRIPPED line (code evidence) plus the RAW line (the
    // `if (true) /* debug */` comment is evidence that it gates an experiment)
    test(line, raw = line) {
      const m = /\bif\s*\(\s*(?:false|true|0)\s*\)\s*\{?|\bwhile\s*\(\s*(?:false|0)\s*\)/.exec(line);
      if (!m) return null;
      // `if (true)` as a comment-style gate is the tell; genuine `if (false)`/`if (0)` too
      if (/\b(?:debug|disable|temporar|hack|experiment|todo|fixme|test)\b/i.test(raw) || /\bif\s*\(\s*(?:false|0)\s*\)/.test(line)) {
        return m[0].trim();
      }
      return null;
    },
  },
  {
    id: "commented-out-debug",
    severity: "warning",
    message: "Commented-out debug line — evidence left in the crime scene (S5). Delete it.",
    test(line) {
      const m = /^\s*(\/\/|#)\s*(console\.(log|debug|info|warn|error)|print\s*\(|debugger\b)/i.exec(line);
      return m ? m[2].replace(/\s*\(.*/, "(") : null;
    },
  },
  {
    id: "uncertainty-marker",
    severity: "warning",
    message: "Uncertainty marker without an owner — the doubt is recorded and abandoned (C1). Owner + ticket, or resolve the doubt.",
    test(line) {
      // comment lines AND inline trailing comments (`x = y; // hack`)
      const commentText = (/^\s*(\/\/|#|\/\*|\*)/.test(line)) ? line : (line.includes("//") ? line.slice(line.indexOf("//")) : line.includes("#") ? line.slice(line.indexOf("#")) : "");
      if (!commentText || !UNCERTAINTY.test(commentText)) return null;
      if (/\b(?:ticket|issue|#\d+|owner|TODO|FIXME|tracked|jira)\b/i.test(commentText)) return null;
      return commentText.trim().slice(0, 60);
    },
  },
];

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
    } else if (st.isFile() && EXTS.has(extname(name).toLowerCase())) {
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
  const files = [];
  const visited = new Set();
  const visitedFiles = new Set();
  for (const p of paths) {
    const abs = resolve(p);
    let st;
    try {
      st = statSync(abs);
    } catch {
      console.error(`bugcraft: cannot read ${p}`);
      process.exit(2);
    }
    if (st.isDirectory()) walk(abs, files, visited, visitedFiles);
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
  const rawLines = text.split("\n");
  // Stateful comment stripping: comments are prose, not evidence — except for
  // the rules whose evidence IS the comment (commented-out-debug,
  // uncertainty-marker, and disabled-code's `if (true) /* debug */` tell).
  // Line rules read the stripped lines; the comment rules read the raw line.
  const JS_COMMENT = /\.(js|mjs|cjs|jsx|ts|tsx|java|cs|rs|swift|kt|kts|go|php)$/i.test(file);
  const HASH_COMMENT = /\.(py|rb|php)$/i.test(file);
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
        } else if (JS_COMMENT && line.startsWith("//", i) && (i === 0 || line[i - 1] !== ":")) {
          break;
        } else if (HASH_COMMENT && line.startsWith("#", i)) {
          break;
        } else {
          out += line[i];
          i += 1;
        }
      }
      lines.push(out);
    }
  }
  let pendingExcept = -1; // python: `except X:` awaiting a silent body
  let pendingCatch = -1;  // js-like: `catch (e) {` awaiting its single-statement body

  lines.forEach((line, i) => {
    const raw = rawLines[i];
    // JS multi-line catch with a single-statement body: console.log / return null
    if (pendingCatch !== -1 && i - pendingCatch <= 2) {
      if (/^\s*console\.(log|error|warn|debug)\s*\([^)]*\)\s*;?\s*$/.test(raw)) {
        findings.push({ file: basename(file), line: pendingCatch + 1, rule: "log-and-swallow", severity: "error",
          message: "Log-and-swallow — the error is printed and dropped (S2). Handle, translate, or propagate it.",
          detail: "catch { console.log(e) }" });
        pendingCatch = -1;
      } else if (/^\s*return\s+(?:null|undefined|-1|false)\s*;?\s*$/.test(raw)) {
        findings.push({ file: basename(file), line: pendingCatch + 1, rule: "silent-catch-return", severity: "warning",
          message: "Silent return from catch — failure becomes indistinguishable from 'no result' (S3). Use result types or rethrow with context.",
          detail: "catch { return null }" });
        pendingCatch = -1;
      } else if (raw.trim() !== "" && !/^\s*\/\//.test(raw)) {
        pendingCatch = -1; // a real body — not a swallow
      }
    }
    if (/^\s*\}?\s*catch\s*\([^)]*\)\s*\{\s*$/.test(line)) pendingCatch = i;
    for (const rule of rules) {
      let detail;
      if (rule.id === "disabled-code") {
        detail = rule.test(line, raw);
      } else {
        const subject = (rule.id === "commented-out-debug" || rule.id === "uncertainty-marker") ? raw : line;
        detail = rule.test(subject);
      }
      if (detail) {
        findings.push({ file: basename(file), line: i + 1, rule: rule.id, severity: rule.severity, message: rule.message, detail });
      }
    }

    // Python multi-line silent catch bodies: `except:` then `pass`/`return None`/`print(e)`
    if (ext === ".py") {
      if (pendingExcept !== -1) {
        const body = /^\s*(pass|return\s+(?:None|-1|False)|print\s*\([^)]*\))\s*(#.*)?$/.exec(raw);
        if (body) {
          const kind = /pass/.test(body[1]) ? "pass" : /return/.test(body[1]) ? "return None" : "print(e)";
          const ruleId = kind === "print(e)" ? "log-and-swallow" : kind === "return None" ? "silent-catch-return" : "swallowed-exception";
          findings.push({
            file: basename(file), line: pendingExcept + 1, rule: ruleId, severity: ruleId === "swallowed-exception" ? "error" : ruleId === "log-and-swallow" ? "error" : "warning",
            message: kind === "print(e)"
              ? "Log-and-swallow — the error is printed and dropped (S2). Handle, translate, or propagate it."
              : kind === "return None"
                ? "Silent return from catch — failure becomes indistinguishable from 'no result' (S3). Use result types or rethrow with context."
                : "Swallowed exception — the error is deleted before anyone reads it (S1). Handle, translate, or propagate.",
            detail: `except: ${kind}`,
          });
          pendingExcept = -1;
        } else if (raw.trim() !== "") {
          pendingExcept = -1;
        }
      }
      if (/^\s*except[^:]*:\s*(#.*)?$/.test(raw)) pendingExcept = i;
    }
  });

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
    console.error("bugcraft: no matching source files found");
    process.exit(2);
  }

  const findings = [];
  for (const f of files) {
    for (const fnd of scan(f)) {
      findings.push({ ...fnd, path: relative(process.cwd(), f) });
    }
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const failed = errors.length + (strict ? warnings.length : 0);

  if (json) {
    console.log(JSON.stringify({ files: files.length, errors, warnings, failed }, null, 2));
  } else {
    const sev = (s) => (s === "error" ? "\x1b[31mERROR\x1b[0m" : "\x1b[33mWARN \x1b[0m");
    for (const f of findings) {
      console.log(`${sev(f.severity)} ${f.rule.padEnd(22)} ${f.path}:${f.line}  ${f.message}`);
      if (f.detail && !f.message.includes(f.detail)) console.log(`        · ${f.detail}`);
    }
    console.log(
      `\nbugcraft: ${files.length} file(s) scanned · ${errors.length} error(s), ${warnings.length} warning(s)` +
        (strict ? " (--strict: warnings fail)" : "") +
        (failed ? " · FAILED" : warnings.length ? " · warnings only (run with --strict to fail)" : " · clean ✓")
    );
  }
  process.exit(failed ? 1 : 0);
}

main();
