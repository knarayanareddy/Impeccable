#!/usr/bin/env node
/**
 * Apicraft contract-diff — mechanical breaking-change detection.
 *
 * Compares two OpenAPI specs (YAML or JSON) and reports the changes that
 * break consumers: removed operations, removed properties, added required
 * fields, changed property types, removed enum values, removed schemas.
 * Zero dependencies; the YAML-subset extractor reads the shape most real
 * specs are written in (paths → operations, components → schemas).
 *
 * Usage:
 *   node contract-diff.mjs old.yaml new.yaml [--json]
 *
 * Exit codes: 0 no breaking changes · 1 breaking changes found · 2 usage error
 */

import { readFileSync } from "node:fs";
import { extract } from "./lib/spec-extract.mjs";

const args = process.argv.slice(2).filter((a) => a !== "--json");
const json = process.argv.includes("--json");
const [oldFile, newFile] = args;
if (!oldFile || !newFile) {
  console.error("contract-diff: usage: node contract-diff.mjs <old-spec> <new-spec> [--json]");
  process.exit(2);
}

const breaking = [];

const oldSpec = extract(readFileSync(oldFile, "utf8"));
const newSpec = extract(readFileSync(newFile, "utf8"));

for (const [key, op] of Object.entries(oldSpec.operations)) {
  if (!newSpec.operations[key]) {
    if (!op.deprecated) breaking.push({ change: "removed-operation", target: key, why: "consumers calling this endpoint break" });
  } else if (op.deprecated && !newSpec.operations[key].deprecated) {
    // un-deprecating is additive — no finding
  }
}
for (const [schema, oldS] of Object.entries(oldSpec.schemas)) {
  const newS = newSpec.schemas[schema];
  if (!newS) {
    breaking.push({ change: "removed-schema", target: schema, why: "types referenced by consumers disappear" });
    continue;
  }
  for (const [prop, oldP] of Object.entries(oldS.properties)) {
    const newP = newS.properties[prop];
    if (!newP) {
      breaking.push({ change: "removed-property", target: `${schema}.${prop}`, why: "consumer parsing breaks on the missing field" });
      continue;
    }
    if (oldP.type && newP.type && oldP.type !== newP.type) {
      breaking.push({ change: "changed-property-type", target: `${schema}.${prop}`, why: `${oldP.type} → ${newP.type}` });
    }
    if (oldP.enum && newP.enum) {
      for (const v of oldP.enum) {
        if (!newP.enum.includes(v)) breaking.push({ change: "removed-enum-value", target: `${schema}.${prop}`, why: `"${v}" no longer valid` });
      }
    }
    if (!oldP.required && newP.required) {
      breaking.push({ change: "added-required-property", target: `${schema}.${prop}`, why: "consumer payloads missing this field now fail validation" });
    }
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

if (json) {
  console.log(JSON.stringify({ old: oldFile, new: newFile, breaking, breakingCount: breaking.length }, null, 2));
} else {
  if (!breaking.length) {
    console.log(`contract-diff: ${oldFile} → ${newFile}: no breaking changes ✓`);
  } else {
    for (const b of breaking) {
      console.log(`\x1b[31mBREAKING\x1b[0m ${b.change.padEnd(24)} ${b.target}  ${b.why}`);
    }
    console.log(`\ncontract-diff: ${breaking.length} breaking change(s) — run through the versioning protocol (version.md / deprecate.md)`);
  }
}
process.exit(breaking.length ? 1 : 0);
