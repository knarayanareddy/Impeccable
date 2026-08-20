#!/usr/bin/env node
/**
 * Dbcraft schema-diff — mechanical breaking-change detection for schemas.
 *
 * Compares two schema snapshots (CREATE TABLE / CREATE INDEX SQL text) and
 * reports the changes that break existing data or consumers: dropped tables,
 * dropped columns, changed column types, added NOT NULL without a default,
 * removed constraints (UNIQUE/CHECK/FK), changed ON DELETE semantics,
 * removed indexes on hot columns (reported, not breaking).
 *
 * Usage:
 *   node schema-diff.mjs old-schema.sql new-schema.sql [--json]
 *
 * Exit codes: 0 no breaking changes · 1 breaking changes found · 2 usage error
 */

import { readFileSync } from "node:fs";
import { extractSchema } from "./lib/schema-extract.mjs";

const args = process.argv.slice(2).filter((a) => a !== "--json");
const json = process.argv.includes("--json");
const [oldFile, newFile] = args;
if (!oldFile || !newFile) {
  console.error("schema-diff: usage: node schema-diff.mjs <old-schema.sql> <new-schema.sql> [--json]");
  process.exit(2);
}

const breaking = [];

const oldSchema = extractSchema(readFileSync(oldFile, "utf8"));
const newSchema = extractSchema(readFileSync(newFile, "utf8"));

// Refuse the silent false-negative: if nothing parsed, "no breaking changes" is a lie.
if (!Object.keys(oldSchema.tables).length || !Object.keys(newSchema.tables).length) {
  console.error("schema-diff: nothing parsed — snapshots must contain CREATE TABLE statements (ALTER-only dumps carry no table shape). Refusing to claim no breaking changes.");
  process.exit(2);
}

for (const [tableName, oldTable] of Object.entries(oldSchema.tables)) {
  const newTable = newSchema.tables[tableName];
  if (!newTable) {
    breaking.push({ change: "dropped-table", target: tableName, why: "all data and consumers of this table break — expand/contract, never drop first" });
    continue;
  }

  const oldByName = new Map(oldTable.columns.map((c) => [c.name, c]));
  const newByName = new Map(newTable.columns.map((c) => [c.name, c]));

  for (const [colName, oldCol] of oldByName) {
    const newCol = newByName.get(colName);
    if (!newCol) {
      breaking.push({ change: "dropped-column", target: `${tableName}.${colName}`, why: "existing data and reads on this column break — add, dual-write, switch, drop later" });
      continue;
    }
    if (oldCol.type && newCol.type && oldCol.type !== newCol.type) {
      breaking.push({ change: "changed-column-type", target: `${tableName}.${colName}`, why: `${oldCol.type} → ${newCol.type} — existing values may not survive the cast` });
    }
    if (!oldCol.notNull && newCol.notNull && newCol.default == null) {
      breaking.push({ change: "added-not-null-without-default", target: `${tableName}.${colName}`, why: "existing NULL rows fail the new constraint — backfill before enforcing" });
    }
    if (oldCol.unique && !newCol.unique) {
      breaking.push({ change: "removed-unique", target: `${tableName}.${colName}`, why: "integrity loosened — duplicates become possible" });
    }
    if (oldCol.references && !newCol.references) {
      breaking.push({ change: "removed-foreign-key", target: `${tableName}.${colName}`, why: "referential integrity loosened — orphans become possible" });
    }
    if (oldCol.onDelete && newCol.onDelete && oldCol.onDelete !== newCol.onDelete) {
      breaking.push({ change: "changed-on-delete", target: `${tableName}.${colName}`, why: `${oldCol.onDelete} → ${newCol.onDelete} — deletion semantics changed silently` });
    }
  }

  // table-level checks removed
  for (const chk of oldTable.checks) {
    if (!newTable.checks.includes(chk)) {
      const renamedPair = newTable.checks.length && oldTable.checks.length === newTable.checks.length;
      breaking.push({ change: "removed-check", target: tableName, why: renamedPair
        ? "removed/added pair — treat as a rename, and verify the replacement states the same rule"
        : "a rule moved out of the schema — the database stops enforcing it" });
    }
  }

  // indexes: dropped index on a column that still exists is a performance regression.
  // If every indexed column was itself dropped, the dropped-column finding already
  // covers it — one finding per change, not two.
  for (const idx of oldTable.indexes) {
    const stillExists = newTable.indexes.some(
      (n) => n.columns.join(",") === idx.columns.join(",")
    );
    if (stillExists) continue;
    const allColumnsDropped = idx.columns.length > 0 &&
      idx.columns.every((c) => !newByName.has(c));
    if (allColumnsDropped) continue;
    breaking.push({ change: "removed-index", target: `${tableName}.${idx.name}`, why: "hot-path queries may fall back to scans — verify the plan before dropping" });
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

if (json) {
  console.log(JSON.stringify({ old: oldFile, new: newFile, breaking, breakingCount: breaking.length }, null, 2));
} else {
  if (!breaking.length) {
    console.log(`schema-diff: ${oldFile} → ${newFile}: no breaking changes ✓`);
  } else {
    for (const b of breaking) {
      console.log(`\x1b[31mBREAKING\x1b[0m ${b.change.padEnd(30)} ${b.target}  ${b.why}`);
    }
    console.log(`\nschema-diff: ${breaking.length} breaking change(s) — route through expand/contract (domains/migrations.md), never destroy first`);
  }
}
process.exit(breaking.length ? 1 : 0);
