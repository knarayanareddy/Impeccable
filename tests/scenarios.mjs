#!/usr/bin/env node
/**
 * Suite-tools behavioral evals — scenario harness.
 *
 * Pins the behaviors of the repo-level tools: impc (installer & router),
 * data-quality (corpus-integrity gate), and evaluate-relevance (routing
 * evals). Zero dependencies.
 *
 * Run:  node tests/scenarios.mjs
 * Exit: 0 all pass · 1 failures
 */

import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync, symlinkSync, lstatSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const IMPC = join(ROOT, "scripts", "impc.mjs");
const DQ = join(ROOT, "scripts", "data-quality.mjs");
const REL = join(ROOT, "scripts", "evaluate-relevance.mjs");
const TMP = join(here, ".tmp-fixtures");
let pass = 0, fail = 0;

function run(name, cmd, args, { cwd, expect, contains = [], notContains = [], env = {} } = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", env: { ...process.env, ...env }, timeout: 60000 });
  const out = (r.stdout || "") + (r.stderr || "");
  if (r.status !== expect) {
    console.log(`✗ ${name} — expected exit ${expect}, got ${r.status}`);
    console.log("   " + out.split("\n").slice(0, 4).join("\n   "));
    fail++;
    return out;
  }
  const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
  if (misses.length) {
    console.log(`✗ ${name} — ${misses.join(", ")}`);
    fail++;
    return out;
  }
  console.log(`✓ ${name}`);
  pass++;
  return out;
}

const node = process.execPath;

// ---------------------------------------------------------------------------
// impc — installer behaviors
// ---------------------------------------------------------------------------

const proj = TMP + "-proj";
const linkProj = TMP + "-link";
const home = TMP + "-home";
const fix = TMP + "-dq";
const badDs = TMP + "-ds";
for (const d of [TMP, proj, linkProj, home, fix, badDs]) rmSync(d, { recursive: true, force: true });
mkdirSync(proj, { recursive: true });

run("impc init: dry-run writes nothing", node, [IMPC, "init", "--ai", "claude", "--skill", "criterion", "--dry-run"], {
  cwd: proj, expect: 0, contains: ["dry run"],
});
if (existsSync(join(proj, ".claude"))) { console.log("✗ impc init: dry-run wrote files"); fail++; }
else { console.log("✓ impc init: dry-run wrote nothing"); pass++; }

run("impc init: copies the skill without its test harness", node, [IMPC, "init", "--ai", "claude", "--skill", "criterion"], {
  cwd: proj, expect: 0, contains: ["done"],
});
if (!existsSync(join(proj, ".claude", "skills", "criterion", "SKILL.md"))) { console.log("✗ impc init: SKILL.md not installed"); fail++; }
else { console.log("✓ impc init: SKILL.md installed"); pass++; }
if (existsSync(join(proj, ".claude", "skills", "criterion", "tests"))) { console.log("✗ impc init: tests/ was shipped"); fail++; }
else { console.log("✓ impc init: tests/ excluded from the install"); pass++; }

run("impc init: re-run is idempotent (unchanged)", node, [IMPC, "init", "--ai", "claude", "--skill", "criterion"], {
  cwd: proj, expect: 0, contains: ["unchanged"],
});

// conflict + force
writeFileSync(join(proj, ".claude", "skills", "criterion", "SKILL.md"), "# local edit\n");
run("impc init: conflicting install is skipped, not clobbered", node, [IMPC, "init", "--ai", "claude", "--skill", "criterion"], {
  cwd: proj, expect: 1, contains: ["exists and differs"],
});
run("impc init: --force overwrites the conflicting install", node, [IMPC, "init", "--ai", "claude", "--skill", "criterion", "--force"], {
  cwd: proj, expect: 0, contains: ["copy"],
});
if (readFileSync(join(proj, ".claude", "skills", "criterion", "SKILL.md"), "utf8").includes("local edit")) {
  console.log("✗ impc init: --force did not overwrite"); fail++;
} else { console.log("✓ impc init: --force restored the shipped skill"); pass++; }

// --link
mkdirSync(linkProj, { recursive: true });
run("impc init: --link symlinks the skill dir", node, [IMPC, "init", "--ai", "universal", "--skill", "bugcraft", "--link"], {
  cwd: linkProj, expect: 0, contains: ["link"],
});
try {
  const st = lstatSync(join(linkProj, ".agents", "skills", "bugcraft"));
  if (!st.isSymbolicLink()) throw new Error("not a symlink");
  console.log("✓ impc init: --link created a real symlink"); pass++;
} catch { console.log("✗ impc init: --link did not create a symlink"); fail++; }

// --global into a fake HOME
run("impc init: --global installs under the home dir", node, [IMPC, "init", "--ai", "claude", "--skill", "shipcraft", "--global"], {
  cwd: proj, expect: 0, env: { HOME: home }, contains: [join(home, ".claude", "skills")],
});

// a FILE blocking the target dir is a clean per-target failure, not a crash
const blocked = TMP + "-blocked";
mkdirSync(blocked, { recursive: true });
writeFileSync(join(blocked, ".claude"), "i am a file");
run("impc init: a file blocking the target dir fails cleanly", node, [IMPC, "init", "--ai", "claude", "--skill", "criterion"], {
  cwd: blocked, expect: 1, contains: ["cannot prepare"],
});

// usage refusals
run("impc init: unknown --ai refused", node, [IMPC, "init", "--ai", "bogus"], { cwd: proj, expect: 2, contains: ["unknown --ai"] });
run("impc init: unknown --skill refused", node, [IMPC, "init", "--ai", "claude", "--skill", "bogus"], { cwd: proj, expect: 2, contains: ["unknown --skill"] });
run("impc init: --ai required", node, [IMPC, "init"], { cwd: proj, expect: 2, contains: ["--ai is required"] });

// ---------------------------------------------------------------------------
// impc — list & find
// ---------------------------------------------------------------------------

const listOut = run("impc list: the ten-skill inventory", node, [IMPC, "list"], { cwd: ROOT, expect: 0, contains: ["criterion", "bugcraft", "160 commands", "301 reference files"] });

run("impc find: routes the flaky-pipeline request to the autom playbook", node, [IMPC, "find", "the pipeline retries the flaky tests to green", "--top", "3"], {
  cwd: ROOT, expect: 0, contains: ["shipcraft/reference/commands/autom.md"],
});
run("impc find: nonsense query is honest about no match", node, [IMPC, "find", "flibbertigibbet wobblebong"], {
  cwd: ROOT, expect: 0, contains: ["no strong match"],
});
run("impc find: --top 0 means zero results, not the default", node, [IMPC, "find", "rollback", "--top", "0"], {
  cwd: ROOT, expect: 0, contains: ["no strong match"], notContains: ["Command:"],
});
const fj = run("impc find: --json output is machine-readable", node, [IMPC, "find", "rollback", "--json"], {
  cwd: ROOT, expect: 0, contains: ['"results"'],
});
try { JSON.parse(fj); console.log("✓ impc find: --json parses"); pass++; } catch { console.log("✗ impc find: --json not parseable"); fail++; }

// ---------------------------------------------------------------------------
// data-quality — corpus-integrity gate
// ---------------------------------------------------------------------------

run("data-quality: the real corpus is clean", node, [DQ], { cwd: ROOT, expect: 0, contains: ["corpus clean"] });

mkdirSync(join(fix, "skill", "alpha", "reference", "commands"), { recursive: true });
mkdirSync(join(fix, "skill", "beta", "reference", "commands"), { recursive: true });
writeFileSync(join(fix, "skill", "alpha", "SKILL.md"), `---
name: alpha
description: a test skill
user-invocable: true
---

## Commands

| Command | Category | What it does | Reference |
|---|---|---|---|
| \`do [x]\` | Build | does the thing | [reference/commands/do.md](reference/commands/do.md) |
| \`ghost [x]\` | Build | links nowhere | [reference/commands/ghost.md](reference/commands/ghost.md) |
`);
writeFileSync(join(fix, "skill", "alpha", "reference", "commands", "do.md"), "# Command: do\n\ndoes it.\n");
writeFileSync(join(fix, "skill", "beta", "SKILL.md"), `---
name: beta
description: another test skill
user-invocable: true
---

## Commands

| Command | Category | What it does | Reference |
|---|---|---|---|
| \`run [x]\` | Build | runs | [reference/commands/run.md](reference/commands/run.md) |
`);
writeFileSync(join(fix, "skill", "beta", "reference", "commands", "run.md"), "# Command: run\n\nruns.\n");
writeFileSync(join(fix, "skill", "beta", "reference", "orphan.md"), "# Orphan\n\nlinked by nobody.\n");
run("data-quality: fixture defects are found (broken link, orphan file)", node, [DQ, "--root", fix], {
  cwd: ROOT, expect: 1, contains: ['unresolved reference "reference/commands/ghost.md"', "unreferenced knowledge file"],
});

// ---------------------------------------------------------------------------
// evaluate-relevance — routing evals
// ---------------------------------------------------------------------------

run("evaluate-relevance: the frozen dataset holds its thresholds", node, [REL], {
  cwd: ROOT, expect: 0, contains: ["thresholds hold"],
});
run("evaluate-relevance: unknown --split refused", node, [REL, "--split", "bogus"], { cwd: ROOT, expect: 2, contains: ["unknown --split"] });

// dataset integrity: an entry pointing at a missing file is a defect, exit 2
mkdirSync(badDs, { recursive: true });
writeFileSync(join(badDs, "bad.json"), JSON.stringify({
  thresholds: { calibration: { top1: 0, top3: 0 }, heldOut: { top1: 0, top3: 0 } },
  calibration: [{ query: "x", skill: "criterion", file: "reference/commands/ghost.md" }],
  heldOut: [{ query: "y", skill: "criterion", file: "SKILL.md" }],
}));
const src = readFileSync(REL, "utf8");
const patchedRel = join(badDs, "eval.mjs");
writeFileSync(patchedRel, src
  .replace('from "./lib/corpus.mjs"', `from "${join(ROOT, "scripts", "lib", "corpus.mjs")}"`)
  .replace('const datasetFile = join(SUITE_ROOT, "tests", "relevance-dataset.json");', `const datasetFile = ${JSON.stringify(join(badDs, "bad.json"))};`));
run("evaluate-relevance: dataset pointing at a missing file refuses", node, [patchedRel], {
  cwd: ROOT, expect: 2, contains: ["dataset defect"],
});

for (const d of [TMP, proj, linkProj, home, fix, badDs, blocked]) rmSync(d, { recursive: true, force: true });
console.log(`\nsuite-tools scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
