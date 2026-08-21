#!/usr/bin/env node
/**
 * Dbcraft deterministic checker.
 *
 * Scans SQL and code files for the schema-slop anti-patterns in
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

const SQL_EXTS = new Set([".sql"]);
const CODE_EXTS = new Set([
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx",
  ".py", ".go", ".java", ".rb", ".php",
  ".c", ".h", ".cc", ".cpp", ".cs", ".rs", ".swift", ".kt", ".kts",
]);
const EXTS = new Set([...SQL_EXTS, ...CODE_EXTS]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage", "target",
  ".next", ".nuxt", ".output", "vendor", ".venv", "__pycache__",
]);

const MONEY_RE = /\b(amount|price|cost|fee|balance|total|tax|rate|salary|credit|debit|payment|charge|discount|revenue|refund|principal|interest)(?:_[a-z]+)?\b/i;

// ---------------------------------------------------------------------------
// Line rules (run on SQL and code files)
// ---------------------------------------------------------------------------

const lineRules = [
  {
    id: "float-for-money",
    severity: "error",
    message: "Floating-point type on a money column — binary floats cannot represent decimal money (T1). Use NUMERIC/DECIMAL or integer minor units.",
    test(line) {
      // column-first (Postgres: `balance FLOAT[8]`) and type-first (MySQL: `FLOAT balance`)
      const colFirst = /([a-z_]+)\s+(?:FLOAT(?:8|4)?|DOUBLE|REAL)(?:\s+PRECISION)?\b/i.exec(line);
      if (colFirst && MONEY_RE.test(colFirst[1])) return `${colFirst[1]} ${colFirst[0].slice(colFirst[1].length).trim()}`;
      const typeFirst = /(?:FLOAT(?:8|4)?|DOUBLE|REAL)(?:\s+PRECISION)?\s+([a-z_]+)/i.exec(line);
      if (typeFirst && MONEY_RE.test(typeFirst[1])) return `${typeFirst[0].trim()}`;
      return null;
    },
  },
  {
    id: "timestamp-without-tz",
    severity: "warning",
    message: "Time column without timezone semantics — prefer timestamptz / a documented UTC policy (T3).",
    test(line) {
      // column-first (Postgres: `created_at TIMESTAMP [WITH TIME ZONE]`; MySQL: `created_at DATETIME`)
      // Zone clause captured per column — a sibling timestamptz must not mask a tz-less one.
      const colFirst = /([a-z_]+)\s+(TIMESTAMP(?:\s*\(\d+\))?|DATETIME(?:\s*\(\d+\))?)(\s+WITH(?:OUT)?\s+TIME\s+ZONE)?\s*[,)\n]/i.exec(line);
      if (colFirst) {
        const col = colFirst[1];
        const type = colFirst[2];
        const zoneClause = colFirst[3] || "";
        const tzOk = /WITH\s+TIME\s+ZONE/i.test(zoneClause) && !/WITHOUT/i.test(zoneClause);
        const timeCol = /(created_at|updated_at|deleted_at|expires_at|due_at|scheduled_at|published_at|occurred_at|sent_at|received_at|confirmed_at)/i.test(col);
        const isTs = /^TIMESTAMP/i.test(type);
        // Postgres TIMESTAMP without tz syntax on any column; DATETIME flagged only on time-named columns
        if ((isTs && !tzOk) || (!isTs && timeCol)) return `${col} ${type}`;
      }
      // type-first (MySQL: `TIMESTAMP created_at`)
      const typeFirst = /(TIMESTAMP|DATETIME)\s*(?:\(\d+\))?\s+([a-z_]+)/i.exec(line);
      if (typeFirst && /(created_at|updated_at|deleted_at|expires_at|due_at|scheduled_at|published_at|occurred_at|sent_at|received_at|confirmed_at)/i.test(typeFirst[2])) {
        return typeFirst[0].trim();
      }
      return null;
    },
  },
  {
    id: "select-star",
    severity: "warning",
    codeOnly: true,
    message: "SELECT * in application code — named columns survive schema changes (Q1).",
    test(line) {
      const m = /\bselect\s+\*\s+from\b/i.exec(line);
      return m ? "SELECT *" : null;
    },
  },
  {
    id: "interpolated-sql",
    severity: "error",
    codeOnly: true,
    message: "String-built SQL from inputs — SQL injection, the oldest bug (Q2). Use bound parameters.",
    test(line) {
      // f-string / template literal / concatenation into a SQL statement
      if (/(f["']|`)\s*[A-Z\s]*\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(line) && /[{}$]/.test(line)) return "interpolated SQL";
      if (/(["'])\s*(SELECT|INSERT|UPDATE|DELETE)\b/i.test(line) && /\+\s*\w/.test(line)) return "concatenated SQL";
      if (/["']\s*(SELECT|INSERT|UPDATE|DELETE)\b/i.test(line) && /\.format\s*\(/.test(line)) return "python .format() SQL";
      if (/["']\s*(SELECT|INSERT|UPDATE|DELETE)\b[^"']*%s/.test(line) && /%\s*\(/.test(line)) return "python %-formatted SQL";
      return null;
    },
  },
  {
    id: "delete-without-where",
    severity: "error",
    message: "DELETE without WHERE — the one-row typo that empties the table (Q5).",
    test(line) {
      // single-line form only — a DELETE without a terminating `;` is a multi-line statement,
      // handled by the windowed pass below
      return /\bdelete\s+from\s+[\w"`.]+[^;]*;\s*$/i.test(line) && !/\bwhere\b/i.test(line) && !/\blimit\s+\d/i.test(line)
        ? line.trim().slice(0, 100)
        : null;
    },
    // windowed form: DELETE FROM t (no semicolon) — WHERE on a following line makes it clean
    opensDelete(line) {
      return /^\s*delete\s+from\s+[\w"`.]+\s*$/i.test(line);
    },
  },
  {
    id: "update-without-where",
    severity: "error",
    message: "UPDATE without WHERE — every row changes, silently (Q5).",
    test(line) {
      return /\bupdate\s+[\w".]+\s+set\b/i.test(line) && !/\bwhere\b/i.test(line)
        ? line.trim().slice(0, 100)
        : null;
    },
  },
  {
    id: "dynamic-ddl",
    severity: "error",
    codeOnly: true,
    message: "Dynamic DDL in application code — schemas built from variables (M4). One table, a column, and indexes.",
    test(line) {
      if (/\b(CREATE|DROP|ALTER)\s+(TABLE|INDEX)\b/i.test(line) && /[{}$]/.test(line)) return "dynamic DDL";
      return null;
    },
  },
  {
    id: "destructive-ddl",
    severity: "warning",
    message: "Destructive DDL — expand/contract first, backup + plan + approval before destroying (G1).",
    test(line) {
      const m = /\b(DROP\s+TABLE|TRUNCATE\s+(TABLE\s+)?)/i.exec(line);
      return m ? m[1] : null;
    },
  },
  {
    id: "offset-pagination",
    severity: "warning",
    message: "LIMIT/OFFSET pagination — at depth it scans everything before the page (Q4). Use keyset pagination.",
    test(line) {
      return /\blimit\s+[\d?$:]+[^;]*\boffset\s+[\d?$:]+/i.test(line) ? "LIMIT ... OFFSET" : null;
    },
  },
];

// ---------------------------------------------------------------------------
// Block rules (CREATE TABLE blocks)
// ---------------------------------------------------------------------------

const BLOCK_RE = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"[]?([\w.]+)[`"\]]?\s*\(([\s\S]*?)\)\s*;/gi;

const COL_START = /^\s*(?!CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK|KEY|INDEX|EXCLUDE)[`"]?([a-z_][a-z0-9_]*)[`"]?/i;

// Split a CREATE TABLE body into column-ish fragments: newlines and commas,
// but commas inside parentheses (NUMERIC(10,2), CHECK (...)) stay intact.
function splitColumns(block) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of block) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if ((ch === "\n" || ch === ",") && depth === 0) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  // comment-only fragments (-- or /* */) belong to the preceding column —
  // the documented-null exemption reads the comment, not a stray fragment
  const merged = [];
  for (const frag of out) {
    if (/^(--|\/\*)/.test(frag) && merged.length) merged[merged.length - 1] += " " + frag;
    else merged.push(frag);
  }
  return merged;
}

function blockRules(block, table, file) {
  const findings = [];
  const lines = splitColumns(block);

  // Primary key presence
  if (!/PRIMARY\s+KEY/i.test(block)) {
    findings.push({ rule: "missing-primary-key", severity: "error", message: `Table "${table}" has no primary key — identity and integrity require one (C2).`, detail: table });
  }

  // Column-level stats
  const colLines = lines.filter((l) => COL_START.test(l) && !/^\s*(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|KEY|INDEX)/i.test(l));
  // Nullable columns whose null meaning is documented (trailing comment) are exempt
  const nullable = colLines.filter((l) => !/\bNOT\s+NULL\b/i.test(l) && !/PRIMARY\s+KEY/i.test(l) && !/--/.test(l));
  const varchar255 = colLines.filter((l) => /VARCHAR\s*\(\s*255\s*\)/i.test(l)).length;
  const jsonCols = colLines.filter((l) => /\bJSONB?\b/i.test(l)).length;
  const boolCols = colLines.filter((l) => /\bBOOL(?:EAN)?\b|\bTINYINT\s*\(\s*1\s*\)/i.test(l)).length;
  const statusCols = [];
  for (const l of colLines) {
    const m = /\b(status|state|type|kind|role)[a-z_]*\s+(?:VARCHAR|TEXT|CHAR)\b/i.exec(l);
    if (m) statusCols.push(m[1] + (m[0].trim().split(/\s+/)[1] ? " (" + m[0].trim().split(/\s+/)[1].toUpperCase() + ")" : ""));
  }
  const hasCheck = /CHECK\s*\(/i.test(block);

  if (nullable.length) {
    findings.push({ rule: "nullable-columns", severity: "warning", message: `Table "${table}" has ${nullable.length} nullable column(s) — null must be a documented decision, not a default (C1).`, detail: `first: ${(nullable[0].trim().match(/[`"]?([a-z_]+)[`"]?\s+/) || ["", "?"])[1]}` });
  }
  if (varchar255 >= 3) {
    findings.push({ rule: "varchar-255-sprawl", severity: "warning", message: `Table "${table}" has ${varchar255} VARCHAR(255) columns — a habit, not a decision (T2).`, detail: "choose deliberate sizes" });
  }
  if (jsonCols >= 3) {
    findings.push({ rule: "json-sprawl", severity: "warning", message: `Table "${table}" has ${jsonCols} JSON columns — JSON is not a schema (M3).`, detail: "real columns for queried fields" });
  }
  if (boolCols >= 3) {
    findings.push({ rule: "boolean-sprawl", severity: "warning", message: `Table "${table}" has ${boolCols} boolean columns — flags hide a lifecycle (T5).`, detail: "model a status/state column" });
  }
  if (statusCols.length && !hasCheck) {
    findings.push({ rule: "stringly-status", severity: "warning", message: `Table "${table}": status-like text columns with no CHECK constraint (T4).`, detail: `columns: ${statusCols.join(", ")}` });
  }

  // FK lines: ON DELETE policy + collect for index check.
  // Two shapes: FOREIGN KEY (col) REFERENCES ... and inline `col TYPE REFERENCES ...`
  const fkRe = /FOREIGN\s+KEY\s*\(([^)]*)\)\s*REFERENCES\s+[`"[\w.]+[`"\]]?\s*\([^)]*\)\s*([^,\n]*)/gi;
  const inlineRefRe = /([a-z_][a-z0-9_]*)\s+(?:BIGINT|INTEGER|INT|SMALLINT|UUID|CHAR|VARCHAR|TEXT)\s*(?:\(\d+(?:,\s*\d+)?\))?\s*REFERENCES\s+[`"[\w.]+[`"\]]?\s*\([^)]*\)\s*([^,\n]*)/gi;
  let m;
  while ((m = fkRe.exec(block))) {
    const fkCol = (m[1] || "fk").trim().replace(/[`"]/g, "").split(",")[0].trim();
    const clause = m[2] || "";
    if (!/ON\s+DELETE/i.test(clause)) {
      findings.push({ rule: "fk-no-on-delete", severity: "warning", message: `Table "${table}": FK on "${fkCol}" has no ON DELETE policy — the engine's silent default is not a policy (C4).`, detail: "write RESTRICT / CASCADE / SET NULL explicitly" });
    }
    findings.push({ rule: "_fk-index-hint", severity: "hint", message: "", detail: "", table, fkCol });
  }
  while ((m = inlineRefRe.exec(block))) {
    const fkCol = m[1];
    const clause = m[2] || "";
    if (!/ON\s+DELETE/i.test(clause)) {
      findings.push({ rule: "fk-no-on-delete", severity: "warning", message: `Table "${table}": FK on "${fkCol}" has no ON DELETE policy — the engine's silent default is not a policy (C4).`, detail: "write RESTRICT / CASCADE / SET NULL explicitly" });
    }
    findings.push({ rule: "_fk-index-hint", severity: "hint", message: "", detail: "", table, fkCol });
  }

  return findings;
}

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
      console.error(`dbcraft: cannot read ${p}`);
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
  const isSql = SQL_EXTS.has(ext);

  // Stateful comment stripping: comments are prose, not evidence. Line rules
  // read the stripped lines; CREATE TABLE block parsing reads the raw text
  // (column comments feed the documented-null exemption).
  const lineComment = isSql
    ? (l, i) => l.startsWith("--", i) || l.startsWith("#", i)
    : /\.(js|mjs|cjs|jsx|ts|tsx)$/i.test(file)
      ? (l, i) => l.startsWith("//", i) && (i === 0 || l[i - 1] !== ":")
      : /\.py$/i.test(file)
        ? (l, i) => l.startsWith("#", i)
        : null;
  const lines = [];
  {
    let inBlock = false;
    for (const rawLine of text.split("\n")) {
      let line = rawLine;
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
        } else if (lineComment && lineComment(line, i)) {
          break;
        } else {
          out += line[i];
          i += 1;
        }
      }
      lines.push(out);
    }
  }

  lines.forEach((raw, i) => {
    for (const rule of lineRules) {
      if (rule.codeOnly && !isCode) continue;
      const detail = rule.test(raw);
      if (detail) {
        findings.push({ file: basename(file), line: i + 1, rule: rule.id, severity: rule.severity, message: rule.message, detail });
      }
    }
  });

  // Windowed DELETE: a DELETE FROM opener whose next lines contain no WHERE and no LIMIT
  for (let i = 0; i < lines.length; i++) {
    const rule = lineRules.find((r) => r.opensDelete);
    if (rule.opensDelete(lines[i])) {
      const rest = lines.slice(i + 1, i + 6).join("\n");
      const stmtEnd = rest.indexOf(";");
      const stmt = stmtEnd === -1 ? rest : rest.slice(0, stmtEnd);
      if (!/\bwhere\b/i.test(stmt) && !/\blimit\s+\d/i.test(stmt)) {
        findings.push({ file: basename(file), line: i + 1, rule: "delete-without-where", severity: "error",
          message: "DELETE without WHERE (multi-line form) — every row goes (Q5).",
          detail: lines[i].trim() });
      }
    }
  }

  // CREATE TABLE blocks (SQL files; also embedded in code but parsed best in .sql)
  if (isSql || isCode) {
    const fkHints = [];
    let bm;
    BLOCK_RE.lastIndex = 0;
    while ((bm = BLOCK_RE.exec(text))) {
      const table = bm[1];
      const block = bm[2];
      const lineNo = text.slice(0, bm.index).split("\n").length;
      for (const f of blockRules(block, table, file)) {
        if (f.rule === "_fk-index-hint") {
          fkHints.push({ table, fkCol: f.fkCol, line: lineNo });
          continue;
        }
        findings.push({ file: basename(file), line: lineNo, rule: f.rule, severity: f.severity, message: f.message, detail: f.detail });
      }
    }
    // FK index check (same-file): does the file define an index on the FK column?
    for (const h of fkHints) {
      const idxRe = new RegExp(`(?:INDEX|KEY)\\s+\\w*\\s*(?:\\([^)]*${h.fkCol}[^)]*\\)|ON\\s+\\w+\\s*\\([^)]*${h.fkCol}[^)]*\\))`, "i");
      if (!idxRe.test(text)) {
        findings.push({
          file: basename(file), line: h.line, rule: "fk-without-index", severity: "warning",
          message: `Table "${h.table}": FK column "${h.fkCol}" has no index in this file — joins, cascades, and orphan checks all need one (I1).`,
          detail: "same-file check only — verify in the live schema",
        });
      }
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
    console.error("dbcraft: no matching SQL or code files found");
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
      console.log(`${sev(f.severity)} ${f.rule.padEnd(20)} ${f.path}:${f.line}  ${f.message}`);
      if (f.detail && !f.message.includes(f.detail)) console.log(`        · ${f.detail}`);
    }
    console.log(
      `\ndbcraft: ${files.length} file(s) scanned · ${errors.length} error(s), ${warnings.length} warning(s)` +
        (strict ? " (--strict: warnings fail)" : "") +
        (failed ? " · FAILED" : warnings.length ? " · warnings only (run with --strict to fail)" : " · clean ✓")
    );
  }
  process.exitCode = failed ? 1 : 0;
}

main();
