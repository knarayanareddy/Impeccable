#!/usr/bin/env node
/**
 * Testcraft deterministic checker.
 *
 * Scans test files for the test-slop anti-patterns in
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

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage", "target",
  ".next", ".nuxt", ".output", "vendor", ".venv", "__pycache__",
]);

// A file is a test file when its name/path says so
const TEST_FILE_RE = /(\.(test|spec)\.[cm]?[jt]sx?$)|(^|[/\\])test_|_test\.(py|go|rb|java|php|cs|rs|swift|kt)$|(^|[/\\])__tests__[/\\]|(^|[/\\])tests?[/\\]|(^|[/\\])(e2e|integration|specs?)[/\\]/i;

// ---------------------------------------------------------------------------
// Line rules
// ---------------------------------------------------------------------------

const rules = [
  {
    id: "focused-test",
    severity: "error",
    message: "Focused test (.only / fit / fdescribe) — CI runs one test while the rest silently rot (H1). Delete before merge; block in CI.",
    test(line) {
      const m = /\b(it|test|describe|context|specify)\s*\.\s*only\s*\(/i.exec(line) ||
        /\b(fit|fdescribe|fcontext)\s*\(/i.exec(line);
      return m ? m[0].replace(/\s*\(/, "(") : null;
    },
  },
  {
    id: "skipped-test",
    severity: "warning",
    message: "Skipped/pending test — skip debt must carry a reason, owner, and tracker — or be pruned (H2).",
    test(line) {
      const m = /\b(it|test|describe|context)\s*\.\s*(skip|todo)\s*\(/i.exec(line) ||
        /\b(xit|xdescribe|xcontext)\s*\(/i.exec(line);
      return m ? m[0].replace(/\s*\(/, "(") : null;
    },
  },
  {
    id: "empty-test",
    severity: "warning",
    message: "Empty test — green with zero meaning (H3). Write the contract or delete the test.",
    test(line) {
      const m = /\b(it|test)\s*\(\s*["'][^"']*["']\s*,\s*(?:async\s*)?(?:\([^)]*\)|function\s*\([^)]*\))\s*=>?\s*\{\s*(?:\/\*[^*/]*\*\/|\/\/[^}]*)?\s*\}\s*\)/i.exec(line);
      if (m) return m[0].slice(0, 60);
      const py = /\bdef\s+(test_[a-z0-9_]+)\s*\([^)]*\)\s*:\s*pass\s*(?:#.*)?$/i.exec(line);
      return py ? `${py[1]}(): pass` : null;
    },
  },
  {
    id: "tautological-assertion",
    severity: "error",
    message: "Literal assertion — asserts a constant, so it always passes (or always fails); the definition of a lie (H4). Assert the actual behavior.",
    test(line) {
      const js = /expect\(\s*(true|false|\d+|'[^']*'|"[^"]*")\s*\)\.(toBe|toEqual|toStrictEqual)\(\s*\1\s*\)/i.exec(line);
      if (js) return `expect(${js[1]}) ${js[2]} ${js[1]}`;
      const sameId = /expect\(\s*([a-zA-Z_$][\w$]*)\s*\)\.(toBe|toEqual|toStrictEqual)\(\s*\1\s*\)/i.exec(line);
      if (sameId) return `expect(${sameId[1]}) ${sameId[2]} ${sameId[1]} — always passes`;
      const py = /assert(?:Equal|True)?\(\s*(True|False|\d+|'[^']*')\s*,?\s*\1?\s*\)/i.exec(line);
      if (py && (py[0].includes("assertEqual") || /assert\s+(True|False)\b/i.test(line))) {
        const simple = /assert\s+(True|False)\b/i.exec(line);
        if (simple) return `assert ${simple[1]}`;
        return `assertEqual(${py[1]}, ${py[1]})`;
      }
      const samePy = /assert(?:Equal|Equals)?\(\s*([a-z_][\w]*)\s*,\s*\1\s*\)/i.exec(line);
      if (samePy) return `assertEqual(${samePy[1]}, ${samePy[1]}) — always passes`;
      const pyBare = /\bassert\s+(True|False)\s*(#.*)?$/i.exec(line);
      return pyBare ? `assert ${pyBare[1]}` : null;
    },
  },
  {
    id: "sleep-in-test",
    severity: "error",
    message: "Sleep as synchronization — a race with a delay (F1). Use waitFor(state) with a timeout, or fake timers.",
    test(line) {
      const m = /(?:^|[.\s])(?:sleep|waitForTimeout)\(|\bsetTimeout\(|\bThread\.sleep\(|\btime\.sleep\(|\bcy\.wait\(\s*\d|\bpage\.waitForTimeout\(/i.exec(line);
      return m ? m[0].trim().replace(/\s*\(.*/, "(") : null;
    },
  },
  {
    id: "random-in-test",
    severity: "warning",
    message: "Unseeded randomness in a test — nondeterministic inputs (F2). Seed it or inject the RNG.",
    test(line) {
      return /\bMath\.random\s*\(/i.test(line) ? "Math.random()" : null;
    },
  },
  {
    id: "retry-mask",
    severity: "warning",
    message: "Retry mask on a test — the flake still exists, now slower (F4). Fix the root cause; a retry is a stopgap with a ticket.",
    test(line) {
      const m = /\bretryTimes\s*\(|\bmark\.flaky\b|@flaky\s*\(|@retry\s*\(|\breruns\s*=|\bthis\.retries\s*\(/i.exec(line);
      return m ? m[0].trim() : null;
    },
  },
  {
    id: "network-in-test",
    severity: "warning",
    message: "Direct network call in a test — unit tests must be offline (L2). Fake the boundary, or name this an integration test honestly.",
    test(line) {
      const m = /\bfetch\s*\(|\baxios(?:\.|\s)|\brequests\.(get|post|put|delete|patch|head)\s*\(|\bhttp\.(get|post|put|delete|patch)\s*\(|\bgot\s*\(/i.exec(line);
      return m ? m[0].trim().replace(/\s*\(.*/, "(") : null;
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
    else if (st.isFile() && CODE_EXTS.has(extname(name).toLowerCase())) acc.push(p);
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
      console.error(`testcraft: cannot read ${p}`);
      process.exit(2);
    }
    if (st.isDirectory()) walk(abs, files);
    else if (CODE_EXTS.has(extname(abs).toLowerCase())) files.push(abs);
  }
  return [...new Set(files)];
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

function isTestFile(p) {
  return TEST_FILE_RE.test(p.replaceAll("\\", "/"));
}

// Integration/E2E-level files honestly hit local services — the network rule does not apply
function isNetworkHonest(p) {
  return /(^|[/\\])(integration|e2e|api|contract)([/\\]|$)/i.test(p.replaceAll("\\", "/"));
}

function scan(file) {
  const findings = [];
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return findings;
  }
  const rawLines = text.split("\n");
  // Stateful comment stripping: comments are prose, not evidence. Windowed
  // catches (empty bodies) walk the raw lines — the comments ARE the evidence there.
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
        } else if (/\.(js|mjs|cjs|jsx|ts|tsx)$/i.test(file) && line.startsWith("//", i) && (i === 0 || line[i - 1] !== ":")) {
          break;
        } else if (/\.py$/i.test(file) && line.startsWith("#", i)) {
          break;
        } else {
          out += line[i];
          i += 1;
        }
      }
      lines.push(out);
    }
  }
  let pendingPyTest = -1; // python: `def test_x():` awaiting a `pass` body

  lines.forEach((raw, i) => {
    for (const rule of rules) {
      if (rule.id === "network-in-test" && isNetworkHonest(file)) continue;
      const detail = rule.test(raw);
      if (detail) {
        findings.push({ file: basename(file), line: i + 1, rule: rule.id, severity: rule.severity, message: rule.message, detail });
      }
    }
    // Python two-line empty test: `def test_x():` followed by `pass`
    if (pendingPyTest !== -1) {
      if (/^\s*pass\s*(#.*)?$/.test(raw)) {
        findings.push({ file: basename(file), line: pendingPyTest + 1, rule: "empty-test", severity: "warning", message: "Empty test — green with zero meaning (H3). Write the contract or delete the test.", detail: `def ... : pass` });
        pendingPyTest = -1;
      } else if (raw.trim() !== "") {
        pendingPyTest = -1;
      }
    }
    if (/^\s*def\s+test_[a-z0-9_]+\s*\([^)]*\)\s*:\s*(#.*)?$/i.test(raw)) pendingPyTest = i;
  });

  // File-level: test definitions but no assertions anywhere
  const hasTests = /\b(it|test)\s*\(|\bdef\s+test_/i.test(text);
  const hasAssertions = /\bexpect\s*\(|\bassert[A-Za-z]*\s*\(|\bassert\s+[^;=]|\bshould\s*\(|\.should\s*\./i.test(text);
  if (hasTests && !hasAssertions) {
    findings.push({
      file: basename(file), line: 1, rule: "no-assertions-in-file", severity: "warning",
      message: "Test file with test definitions but no assertions — the green is a rumor (H5).",
      detail: "every test must assert a contract",
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
  const testFiles = files.filter(isTestFile);
  if (!files.length) {
    console.error("testcraft: no matching source files found");
    process.exit(2);
  }

  const all = [];
  for (const f of testFiles) {
    for (const fnd of scan(f)) {
      all.push({ ...fnd, path: relative(process.cwd(), f) });
    }
  }

  const errors = all.filter((f) => f.severity === "error");
  const warnings = all.filter((f) => f.severity === "warning");
  const failed = errors.length + (strict ? warnings.length : 0);

  if (json) {
    console.log(JSON.stringify({ files: files.length, testFiles: testFiles.length, errors, warnings, failed }, null, 2));
  } else {
    const sev = (s) => (s === "error" ? "\x1b[31mERROR\x1b[0m" : "\x1b[33mWARN \x1b[0m");
    for (const f of all) {
      console.log(`${sev(f.severity)} ${f.rule.padEnd(22)} ${f.path}:${f.line}  ${f.message}`);
      if (f.detail && !f.message.includes(f.detail)) console.log(`        · ${f.detail}`);
    }
    console.log(
      `\ntestcraft: ${testFiles.length} test file(s) scanned · ${errors.length} error(s), ${warnings.length} warning(s)` +
        (strict ? " (--strict: warnings fail)" : "") +
        (failed ? " · FAILED" : warnings.length ? " · warnings only (run with --strict to fail)" : " · clean ✓")
    );
  }
  process.exit(failed ? 1 : 0);
}

main();
