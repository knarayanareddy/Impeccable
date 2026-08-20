#!/usr/bin/env node
/**
 * Dbcraft behavioral evals — scenario harness.
 *
 * Pins checker behaviors (rules, severities, exemptions, windowed DELETE,
 * comment stripping), the schema-diff breaking-change detector, and the
 * migration-review daemon protocol. Zero dependencies.
 *
 * Run:  node tests/scenarios.mjs
 * Exit: 0 all pass · 1 failures
 */

import { execFileSync, spawn } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CHECKER = join(here, "..", "scripts", "check.mjs");
const DIFF = join(here, "..", "scripts", "schema-diff.mjs");
const REVIEW = join(here, "..", "scripts", "migration-review.mjs");
const TMP = join(here, ".tmp-fixtures");
let pass = 0, fail = 0;

const scenarios = [];
function scenario(name, { files, args = [], exitCode, contains = [], notContains = [], json = false }) {
  scenarios.push({ name, files, args, exitCode, contains, notContains, json });
}
const FIX = (name, content) => [name, content];

// ---- checker: types ----
scenario("float-for-money flagged (both directions + FLOAT8)", {
  files: [FIX("t.sql", `CREATE TABLE t (id INT PRIMARY KEY, balance FLOAT, rate FLOAT8, qty DOUBLE PRECISION);`)],
  exitCode: 1, contains: ["float-for-money"],
});
scenario("NUMERIC money clean", {
  files: [FIX("t.sql", `CREATE TABLE t (id INT PRIMARY KEY, amount NUMERIC(10,2) NOT NULL);`)],
  exitCode: 0, notContains: ["float-for-money"],
});
scenario("tz-less timestamp flagged; timestamptz clean", {
  files: [FIX("t.sql", `CREATE TABLE t (id INT PRIMARY KEY, created_at TIMESTAMP, updated_at TIMESTAMPTZ);`)],
  exitCode: 0, contains: ["timestamp-without-tz"],
});
scenario("select-star flagged; projected clean", {
  files: [FIX("t.js", `db.query("SELECT * FROM users");\ndb.query("SELECT id FROM users");`)],
  exitCode: 0, contains: ["select-star"],
});
scenario("interpolated SQL flagged; bound params clean", {
  files: [FIX("t.js", `db.query(\`SELECT * FROM t WHERE id = \${x}\`);\ndb.query("SELECT id FROM t WHERE id = ?", [x]);`)],
  exitCode: 1, contains: ["interpolated-sql"],
});

// ---- checker: keys & constraints (block parser) ----
scenario("missing primary key flagged (error)", {
  files: [FIX("t.sql", `CREATE TABLE t (id BIGINT, name TEXT);`)],
  exitCode: 1, contains: ["missing-primary-key"],
});
scenario("nullable columns flagged; documented null exempt", {
  files: [FIX("t.sql", `CREATE TABLE t (\n  id INT PRIMARY KEY,\n  name TEXT,\n  deleted_at TIMESTAMPTZ -- null = not deleted\n);`)],
  exitCode: 0, contains: ["nullable-columns"],
});
scenario("varchar-255 sprawl at 3+ flagged", {
  files: [FIX("t.sql", `CREATE TABLE t (id INT PRIMARY KEY, a VARCHAR(255), b VARCHAR(255), c VARCHAR(255));`)],
  exitCode: 0, contains: ["varchar-255-sprawl"],
});
scenario("boolean sprawl at 3+ flagged", {
  files: [FIX("t.sql", `CREATE TABLE t (id INT PRIMARY KEY, a BOOLEAN, b BOOLEAN, c BOOLEAN);`)],
  exitCode: 0, contains: ["boolean-sprawl"],
});
scenario("json sprawl at 3+ flagged", {
  files: [FIX("t.sql", `CREATE TABLE t (id INT PRIMARY KEY, a JSON, b JSON, c JSON);`)],
  exitCode: 0, contains: ["json-sprawl"],
});
scenario("documented-null comment after a comma-split column exempts it", {
  files: [FIX("t.sql", `CREATE TABLE t (id INT PRIMARY KEY, deleted_at TIMESTAMPTZ, -- null = not deleted\n);`)],
  exitCode: 0, notContains: ["nullable-columns"],
});
scenario("stringly status without CHECK flagged", {
  files: [FIX("t.sql", `CREATE TABLE t (id INT PRIMARY KEY, status VARCHAR(20));`)],
  exitCode: 0, contains: ["stringly-status"],
});
scenario("FK without ON DELETE flagged; with policy clean", {
  files: [FIX("t.sql", `CREATE TABLE t (\n  id INT PRIMARY KEY,\n  user_id BIGINT REFERENCES users(id),\n  team_id BIGINT REFERENCES teams(id) ON DELETE RESTRICT\n);\nCREATE INDEX t_user_id_idx ON t (user_id);\nCREATE INDEX t_team_id_idx ON t (team_id);`)],
  exitCode: 0, contains: ["fk-no-on-delete"],
});
scenario("FK without same-file index flagged", {
  files: [FIX("t.sql", `CREATE TABLE t (\n  id INT PRIMARY KEY,\n  user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT\n);`)],
  exitCode: 0, contains: ["fk-without-index"],
});

// ---- checker: mutations & ddl ----
scenario("DELETE without WHERE flagged (single-line)", {
  files: [FIX("t.sql", `DELETE FROM users;`)],
  exitCode: 1, contains: ["delete-without-where"],
});
scenario("DELETE without WHERE flagged (multi-line)", {
  files: [FIX("t.sql", `DELETE FROM orders\n;`)],
  exitCode: 1, contains: ["delete-without-where"],
});
scenario("DELETE with WHERE on next line clean", {
  files: [FIX("t.sql", `DELETE FROM audit\nWHERE created_at < now();`)],
  exitCode: 0, notContains: ["delete-without-where"],
});
scenario("UPDATE without WHERE flagged", {
  files: [FIX("t.sql", `UPDATE orders SET total = 0;`)],
  exitCode: 1, contains: ["update-without-where"],
});
scenario("destructive DDL flagged", {
  files: [FIX("t.sql", `DROP TABLE legacy;\nTRUNCATE users;`)],
  exitCode: 0, contains: ["destructive-ddl"],
});
scenario("dynamic DDL in code flagged", {
  files: [FIX("t.js", `await db.execute(\`CREATE TABLE \${t} (id INT)\`);`)],
  exitCode: 1, contains: ["dynamic-ddl"],
});
scenario("OFFSET pagination flagged", {
  files: [FIX("t.js", `db.query("SELECT id FROM t LIMIT 20 OFFSET 1000");`)],
  exitCode: 0, contains: ["offset-pagination"],
});

// ---- checker: comment stripping ----
scenario("prose comments are not evidence", {
  files: [FIX("t.sql", `-- this query used SELECT * FROM users and DROP TABLE in the old design\nCREATE TABLE t (id INT PRIMARY KEY, amount NUMERIC(10,2) NOT NULL);`)],
  exitCode: 0, notContains: ["select-star", "destructive-ddl", "float-for-money"],
});

// ---- checker: clean pass ----
scenario("idiomatic schema passes clean", {
  files: [FIX("t.sql", `CREATE TABLE users (\n  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  email VARCHAR(320) NOT NULL UNIQUE,\n  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),\n  balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  deleted_at TIMESTAMPTZ -- null = not deleted\n);\nCREATE UNIQUE INDEX users_email_active_idx ON users (email) WHERE deleted_at IS NULL;`)],
  exitCode: 0,
});

// ---- schema-diff scenarios ----
async function diffScenario(name, oldSpec, newSpec, { exitCode, contains = [], notContains = [], json = false }) {
  const dir = TMP + "-sd-" + name.replace(/[^a-z0-9]/gi, "");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "old.sql"), oldSpec);
  writeFileSync(join(dir, "new.sql"), newSpec);
  try {
    try {
      const out = execFileSync("node", json ? [DIFF, join(dir, "old.sql"), join(dir, "new.sql"), "--json"] : [DIFF, join(dir, "old.sql"), join(dir, "new.sql")], { encoding: "utf8" });
      if (exitCode !== 0) { console.log(`✗ ${name} — expected exit ${exitCode}, got 0`); fail++; return; }
      if (json) { try { JSON.parse(out); } catch { console.log(`✗ ${name} — --json not parseable`); fail++; return; } }
      const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
      if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
      console.log(`✓ ${name}`); pass++;
    } catch (e) {
      const out = (e.stdout || "") + (e.stderr || "");
      if (e.status !== exitCode) { console.log(`✗ ${name} — expected exit ${exitCode}, got ${e.status}`); fail++; return; }
      if (json) { try { JSON.parse(out); } catch { console.log(`✗ ${name} — --json not parseable`); fail++; return; } }
      const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
      if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
      console.log(`✓ ${name}`); pass++;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const OLD = `CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  team_id BIGINT REFERENCES teams(id) ON DELETE RESTRICT,
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX users_email_active_idx ON users (email) WHERE deleted_at IS NULL;
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  total NUMERIC(12,2) NOT NULL
);
CREATE INDEX orders_user_id_idx ON orders (user_id);
`;
const ADDITIVE = OLD + `\nCREATE TABLE refunds (\n  id BIGINT PRIMARY KEY,\n  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT\n);\n`;
const DESTRUCTIVE = `CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  balance_cents DOUBLE PRECISION NOT NULL,
  team_id BIGINT,
  deleted_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total NUMERIC(12,2) NOT NULL
);
`;

await diffScenario("schema-diff: ALTER-only snapshots refuse (no silent clean claim)", "ALTER TABLE t ADD COLUMN x INT;\n", "ALTER TABLE t DROP COLUMN x;\n", { exitCode: 2 });
await diffScenario("schema-diff: schema-qualified additive is free", "CREATE TABLE public.users (\n  id BIGINT PRIMARY KEY\n);\n", "CREATE TABLE public.users (\n  id BIGINT PRIMARY KEY,\n  name TEXT\n);\n", { exitCode: 0, notContains: ["BREAKING"] });
await diffScenario("schema-diff: renamed column reports the drop honestly", "CREATE TABLE t (\n  id INT PRIMARY KEY,\n  old_name TEXT\n);\n", "CREATE TABLE t (\n  id INT PRIMARY KEY,\n  new_name TEXT\n);\n", { exitCode: 1, contains: ["dropped-column"] });
await diffScenario("schema-diff: additive changes are free", OLD, ADDITIVE, { exitCode: 0, notContains: ["BREAKING"] });
await diffScenario("schema-diff: dropped column flagged", OLD, OLD.replace(/\n  role VARCHAR\(20\) NOT NULL DEFAULT 'member',/, ""), { exitCode: 1, contains: ["dropped-column"] });
await diffScenario("schema-diff: type change + on-delete + not-null + removed-unique + removed-check flagged", OLD, DESTRUCTIVE, {
  exitCode: 1,
  contains: ["changed-column-type", "changed-on-delete", "added-not-null-without-default", "removed-unique", "removed-check", "removed-foreign-key"],
});
await diffScenario("schema-diff: removed index flagged", OLD, OLD.replace(/CREATE UNIQUE INDEX users_email_active_idx[\s\S]*?\n/, ""), { exitCode: 1, contains: ["removed-index"] });
await diffScenario("schema-diff: --json emits machine shape", OLD, DESTRUCTIVE, { exitCode: 1, contains: ['"breaking"'], json: true });

// ---- migration-review daemon protocol ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await (async () => {
  const dir = TMP + "-mr";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "steps.json"), JSON.stringify([
    { name: "001_add_currency", up: "ALTER TABLE orders ADD COLUMN currency CHAR(3)", down: "ALTER TABLE orders DROP COLUMN currency", reversible: true, lockImpact: "none" },
    { name: "002_drop_legacy", up: "DROP TABLE legacy;", down: "(none)", reversible: false, lockImpact: "exclusive" },
  ]));
  const port = 8996;
  const srv = spawn("node", [REVIEW, "--steps", "steps.json", "--round", "r1", "--port", String(port)], { cwd: dir });
  try {
    let up = false;
    for (let i = 0; i < 20; i++) {
      try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
      await wait(150);
    }
    if (!up) { console.log("✗ migration-review: did not come up"); fail++; }
    else {
      const page = await (await fetch(`http://localhost:${port}/`)).text();
      if (!page.includes("001_add_currency") || !page.includes("002_drop_legacy")) { console.log("✗ migration-review: steps missing from page"); fail++; }
      else {
        console.log("✓ migration-review: serves every step"); pass++;
        const partial = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "001_add_currency": "approved" } }) });
        if (partial.status !== 400) { console.log("✗ migration-review: partial submit not rejected"); fail++; }
        else {
          console.log("✓ migration-review: partial submit rejected"); pass++;
          const full = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "001_add_currency": "approved", "002_drop_legacy": "flagged" } }) });
          if (full.status !== 200) { console.log("✗ migration-review: full submit rejected"); fail++; }
          else {
            const out = execFileSync("node", [REVIEW, "--round", "r1", "--result"], { cwd: dir, encoding: "utf8" });
            if (!out.includes('"name": "002_drop_legacy"') || !out.includes('"verdict": "flagged"')) { console.log("✗ migration-review: result missing verdicts"); fail++; }
            else { console.log("✓ migration-review: verdicts recorded and readable"); pass++; }
          }
        }
      }
    }
  } finally {
    srv.kill();
    rmSync(dir, { recursive: true, force: true });
  }
})();

// ---- runner (file scenarios) ----
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
for (const s of scenarios) {
  for (const [name, content] of s.files) writeFileSync(join(TMP, name), content);
  const files = s.files.map(([name]) => join(TMP, name));
  try {
    const out = execFileSync("node", [CHECKER, ...s.args, ...files], { encoding: "utf8" });
    if (s.exitCode !== 0) { console.log(`✗ ${s.name} — expected exit ${s.exitCode}, got 0`); fail++; continue; }
    const misses = [...s.contains.filter((c) => !out.includes(c)), ...s.notContains.filter((c) => out.includes(c))];
    if (misses.length) { console.log(`✗ ${s.name} — ${misses.join(", ")}`); fail++; continue; }
    console.log(`✓ ${s.name}`);
    pass++;
  } catch (e) {
    const out = (e.stdout || "") + (e.stderr || "");
    if (e.status !== s.exitCode) { console.log(`✗ ${s.name} — expected exit ${s.exitCode}, got ${e.status}`); fail++; continue; }
    if (s.json) {
      try { JSON.parse(out); } catch { console.log(`✗ ${s.name} — --json output not parseable`); fail++; continue; }
    }
    const misses = [...s.contains.filter((c) => !out.includes(c)), ...s.notContains.filter((c) => out.includes(c))];
    if (misses.length) { console.log(`✗ ${s.name} — ${misses.join(", ")}`); fail++; continue; }
    console.log(`✓ ${s.name}`);
    pass++;
  }
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\ndbcraft scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
