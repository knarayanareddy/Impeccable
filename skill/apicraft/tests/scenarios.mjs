#!/usr/bin/env node
/**
 * Apicraft behavioral evals — scenario harness.
 *
 * Pins checker behaviors (rules, severities, exemptions, spec-lint), the
 * contract-diff breaking-change detector, and the review-daemon protocol.
 * Zero dependencies.
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
const DIFF = join(here, "..", "scripts", "contract-diff.mjs");
const REVIEW = join(here, "..", "scripts", "review.mjs");
const TMP = join(here, ".tmp-fixtures");
let pass = 0, fail = 0;

const scenarios = [];
function scenario(name, { files, args = [], exitCode, contains = [], notContains = [], json = false }) {
  scenarios.push({ name, files, args, exitCode, contains, notContains, json });
}
const FIX = (name, content) => [name, content];

// ---- checker: routing ----
scenario("verb-in-url flagged (case-insensitive, hyphen boundary)", {
  files: [FIX("t.js", `app.get("/api/getuser", h);\napp.get("/api/get-user", h);`)],
  exitCode: 1, contains: ["verb-in-url"],
});
scenario("clean resource path exempt (settings is a resource, not a verb)", {
  files: [FIX("t.js", `app.get("/api/v1/users", h);\napp.get("/api/v1/settings", h);`)],
  exitCode: 0, notContains: ["verb-in-url"],
});
scenario("GET with side effects flagged; clean GET exempt", {
  files: [FIX("t.js", `app.get("/api/v1/users/delete", h);\napp.get("/api/v1/orders", h);`)],
  exitCode: 1, contains: ["get-with-side-effects", "verb-in-url"],
});
scenario("deep resource nesting flagged at 3+; 2 levels clean", {
  files: [FIX("t.js", `app.post("/api/v1/users/:uid/orders/:oid/items", h);\napp.get("/api/v1/users/:uid/orders", h);`)],
  exitCode: 0, contains: ["deep-resource-nesting"],
});
scenario("minor version in path flagged", {
  files: [FIX("t.js", `app.get("/api/v1.1/orders", h);`)],
  exitCode: 0, contains: ["minor-version-in-path"],
});
scenario("unversioned api flagged; versioned clean", {
  files: [FIX("t.js", `app.get("/api/orders", h);`)],
  exitCode: 0, contains: ["unversioned-api"],
});

// ---- checker: contract semantics ----
scenario("success wrapper flagged; plain json clean", {
  files: [FIX("t.js", `res.status(200).json({ success: false });\nres.status(200).json({ items: [] });`)],
  exitCode: 0, contains: ["success-wrapper"],
});
scenario("leaked internals in a response flagged", {
  files: [FIX("t.js", `res.status(500).json({ stack: err.stack });`)],
  exitCode: 1, contains: ["leaked-internals"],
});
scenario("empty error body flagged; 200-without-body clean", {
  files: [FIX("t.js", `res.status(500).send();\nres.status(200).send();`)],
  exitCode: 0, contains: ["empty-error-body"],
});
scenario("429 without Retry-After flagged; with it clean", {
  files: [FIX("t.js", `res.status(429).json({ error: "slow down" });\nres.status(429).set("Retry-After", "30").json({});`)],
  exitCode: 0, contains: ["no-retry-after"],
});
scenario("unbounded page size flagged; capped clean", {
  files: [FIX("t.js", `const pageSize = 10000;\nconst limit = Math.min(n, 100);`)],
  exitCode: 0, contains: ["unbounded-page-size"],
});
scenario("date-as-string flagged", {
  files: [FIX("t.ts", `type Order = { createdAt: string };`)],
  exitCode: 0, contains: ["date-as-string"],
});

// ---- checker: secrets ----
scenario("hardcoded credential flagged (quoted) and redacted", {
  files: [FIX("t.js", `const apiKey = "sk-live-9f8e7d6c5b4a3210";`)],
  exitCode: 1, contains: ["hardcoded-credential", "<redacted>"], notContains: ["sk-live-9f8e7d6c5b4a3210"],
});
scenario("env-fallback credential flagged", {
  files: [FIX("t.js", `const apiKey = process.env.API_KEY || "sk-live-9f8e7d6c5b4a";`)],
  exitCode: 1, contains: ["hardcoded-credential"],
});
scenario("placeholder values exempt", {
  files: [FIX("t.js", `const apiKey = "changeme";\nconst pw = "password";`)],
  exitCode: 0, notContains: ["hardcoded-credential"],
});

// ---- checker: queries & sql ----
scenario("select-star flagged; projected clean", {
  files: [FIX("t.js", `db.query("SELECT * FROM users");\ndb.query("SELECT id, email FROM users");`)],
  exitCode: 0, contains: ["select-star"],
});

// ---- checker: spec-lint (block-accurate) ----
scenario("spec-lint: missing responses and operationId flagged per operation", {
  files: [FIX("t.yaml", `paths:\n  /things:\n    get:\n      summary: List\n    post:\n      summary: Create\n      responses:\n        "201":\n          description: ok\n`)],
  exitCode: 0, contains: ["spec-missing-responses", "spec-missing-operationid"],
});
scenario("spec-lint: complete operations clean", {
  files: [FIX("t.yaml", `paths:\n  /things:\n    get:\n      operationId: listThings\n      responses:\n        "200":\n          description: ok\n`)],
  exitCode: 0, notContains: ["spec-missing"],
});

// ---- checker: file-level & scope ----
scenario("template-literal interpolations are not resource segments", {
  files: [FIX("t.js", `app.get("/api/v1/orders/:id", h);\nres.location(\`/api/v1/orders/\${order.id}\`);`)],
  exitCode: 0, notContains: ["deep-resource-nesting"],
});
scenario("mixed field casing in spec files is vocabulary, not payload casing", {
  files: [FIX("t.yaml", `paths:\n  /x:\n    get:\n      operationId: getX\n      responses: { "200": { description: ok } }\ncomponents:\n  schemas:\n    S:\n      properties:\n        user_id: { type: string }\n        first_name: { type: string }\n      required: [user_id]\n`)],
  exitCode: 0, notContains: ["mixed-field-casing"],
});
scenario("mixed field casing flagged in one file", {
  files: [FIX("t.ts", `type A = { user_id: string; first_name: string; userId: number; userName: string };`)],
  exitCode: 0, contains: ["mixed-field-casing"],
});
scenario("no-spec-file: project scope only (directory scan flags, single file exempt)", {
  files: [FIX("t.js", `app.get("/api/v1/orders", h);`)],
  exitCode: 0, notContains: ["no-spec-file"],
});

// ---- contract-diff scenarios ----
async function diffScenario(name, oldSpec, newSpec, { exitCode, contains = [], notContains = [] }) {
  try {
    const dir = TMP + "-diff-" + name.replace(/[^a-z0-9]/gi, "");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "old.yaml"), oldSpec);
    writeFileSync(join(dir, "new.yaml"), newSpec);
    try {
      const out = execFileSync("node", [DIFF, join(dir, "old.yaml"), join(dir, "new.yaml")], { encoding: "utf8" });
      if (exitCode !== 0) { console.log(`✗ ${name} — expected exit ${exitCode}, got 0`); fail++; return; }
      const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
      if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
      console.log(`✓ ${name}`); pass++;
    } catch (e) {
      const out = (e.stdout || "") + (e.stderr || "");
      if (e.status !== exitCode) { console.log(`✗ ${name} — expected exit ${exitCode}, got ${e.status}`); fail++; return; }
      const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
      if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
      console.log(`✓ ${name}`); pass++;
    }
  } finally {
    rmSync(TMP + "-diff-" + name.replace(/[^a-z0-9]/gi, ""), { recursive: true, force: true });
  }
}

const BASE = (extraPaths = "", extraSchemas = "") => `openapi: 3.0.3
info: { title: T, version: 1.0.0 }
paths:
  /orders:
    get:
      operationId: listOrders
      responses: { "200": { description: ok } }
${extraPaths}
components:
  schemas:
    Order:
      type: object
      properties:
        status: { type: string, enum: [pending, paid, shipped] }
        total_cents:
          type: integer
      required: [status]
${extraSchemas}
`;

await diffScenario("contract-diff: additive changes are free", BASE(), BASE().replace("version: 1.0.0", "version: 1.1.0").replace("enum: [pending, paid, shipped]", "enum: [pending, paid, shipped, refunded]").replace("total_cents:\n          type: integer", "total_cents:\n          type: integer\n        currency:\n          type: string"), { exitCode: 0, notContains: ["BREAKING"] });

await diffScenario("contract-diff: removed operation flagged", BASE(), BASE().replace(/\n  \/orders:\n    get:[\s\S]*?responses: \{ "200": \{ description: ok \} \}\n/, ""), { exitCode: 1, contains: ["removed-operation"] });

await diffScenario("contract-diff: deprecated removal exempt (announced in the OLD spec)", BASE('    post:\n      operationId: createOrder\n      deprecated: true\n      responses: { "201": { description: created } }'), BASE(), { exitCode: 0, notContains: ["BREAKING"] });

await diffScenario("contract-diff: deprecated only in the NEW spec still breaks (no window)", BASE('    post:\n      operationId: createOrder\n      responses: { "201": { description: created } }'), BASE('    post:\n      operationId: createOrder\n      deprecated: true\n      responses: { "201": { description: created } }').replace(/\n    post:[\s\S]*?description: created \} \}\n/, "\n"), { exitCode: 1, contains: ["removed-operation"] });

await diffScenario("contract-diff: enum removal + type change + added required flagged", BASE(), BASE()
  .replace("enum: [pending, paid, shipped]", "enum: [pending, paid]")
  .replace(/total_cents:\n          type: integer/, "total_cents:\n          type: string")
  .replace("required: [status]", "required: [status, total_cents]"), { exitCode: 1, contains: ["removed-enum-value", "changed-property-type", "added-required-property"] });

await diffScenarioJson("contract-diff: --json emits machine shape", BASE(), BASE().replace("enum: [pending, paid, shipped]", "enum: [pending, paid]"));
async function diffScenarioJson(name, oldSpec, newSpec) {
  const dir = TMP + "-diff-json";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "old.yaml"), oldSpec);
  writeFileSync(join(dir, "new.yaml"), newSpec);
  try {
    try {
      execFileSync("node", [DIFF, join(dir, "old.yaml"), join(dir, "new.yaml"), "--json"], { stdio: "pipe" });
      console.log(`✗ ${name} — expected exit 1`); fail++;
    } catch (e) {
      let out = (e.stdout || "") + (e.stderr || "");
      let parsed = null;
      try { parsed = JSON.parse(out); } catch { console.log(`✗ ${name} — --json output not parseable`); fail++; return; }
      if (parsed.breakingCount === 1 && parsed.breaking[0].change === "removed-enum-value") { console.log(`✓ ${name}`); pass++; }
      else { console.log(`✗ ${name} — unexpected breaking shape`); fail++; }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---- review daemon protocol ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await (async () => {
  const dir = TMP + "-review";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "s.yaml"), `paths:\n  /orders:\n    get:\n      operationId: listOrders\n      responses: { "200": { description: ok } }\n    post:\n      operationId: createOrder\n      responses: { "201": { description: created } }\n`);
  const port = 8998;
  const srv = spawn("node", [REVIEW, "--spec", "s.yaml", "--round", "r1", "--port", String(port)], { cwd: dir });
  try {
    let up = false;
    for (let i = 0; i < 20; i++) {
      try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
      await wait(150);
    }
    if (!up) { console.log("✗ review daemon: did not come up"); fail++; }
    else {
      const page = await (await fetch(`http://localhost:${port}/`)).text();
      if (!page.includes("GET /orders") || !page.includes("POST /orders")) { console.log("✗ review daemon: endpoints missing from page"); fail++; }
      else {
        console.log("✓ review daemon: serves every endpoint");
        pass++;
        const partial = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "GET /orders": "approved" } }) });
        if (partial.status !== 400) { console.log("✗ review daemon: partial submit not rejected"); fail++; }
        else {
          console.log("✓ review daemon: partial submit rejected");
          pass++;
          const full = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "GET /orders": "approved", "POST /orders": "flagged" } }) });
          if (full.status !== 200) { console.log("✗ review daemon: full submit rejected"); fail++; }
          else {
            const out = execFileSync("node", [REVIEW, "--round", "r1", "--result"], { cwd: dir, encoding: "utf8" });
            if (!out.includes('"endpoint": "POST /orders"') || !out.includes('"verdict": "flagged"')) { console.log("✗ review daemon: result missing verdicts"); fail++; }
            else { console.log("✓ review daemon: verdicts recorded and readable"); pass++; }
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
console.log(`\napicraft scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
