#!/usr/bin/env node
/**
 * Suite benchmark — public evidence: run every facet checker against real
 * public repositories and commit the findings.
 *
 * Zero dependencies, deterministic: records the suite commit, each target
 * repo's commit SHA, per-checker counts (files/errors/warnings) and exit
 * codes. A checker that finds nothing in a repo is recorded honestly; a
 * checker with no applicable files (exit 2, "no matching") is recorded as
 * n/a, never as clean.
 *
 * Usage:
 *   node scripts/benchmark.mjs              scan the clones in benchmark/repos/
 *   node scripts/benchmark.mjs --clone      shallow-clone the target repos
 *   node scripts/benchmark.mjs --refresh    re-clone + rescan everything
 *   node scripts/benchmark.mjs --list       print the committed summary
 *
 * Exit codes: 0 · 1 a checker errored unexpectedly · 2 usage error
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const REPOS_DIR = join(ROOT, "benchmark", "repos");
const RESULTS_DIR = join(ROOT, "benchmark", "results");
const SUMMARY = join(ROOT, "benchmark", "summary.md");

const SKILLS = [
  "criterion", "codecraft", "apicraft", "dbcraft", "testcraft",
  "perfcraft", "seccraft", "obscraft", "shipcraft", "bugcraft",
];

// Public targets spanning languages and maturity. Mature, widely-used code is
// the honest test: high-quality repos should find few errors — the benchmark
// proves the checkers run, report, and stay honest on real code.
const TARGETS = [
  { repo: "expressjs/express", url: "https://github.com/expressjs/express.git", note: "JS web framework" },
  { repo: "psf/requests", url: "https://github.com/psf/requests.git", note: "Python HTTP library" },
  { repo: "pallets/flask", url: "https://github.com/pallets/flask.git", note: "Python web framework" },
  { repo: "fastify/fastify", url: "https://github.com/fastify/fastify.git", note: "JS/TS web framework" },
  { repo: "lodash/lodash", url: "https://github.com/lodash/lodash.git", note: "JS utility library" },
  { repo: "sindresorhus/ora", url: "https://github.com/sindresorhus/ora.git", note: "small JS CLI library" },
];

const argv = process.argv.slice(2);
const clone = argv.includes("--clone");
const refresh = argv.includes("--refresh");
const list = argv.includes("--list");

function git(cmd, args, cwd) {
  return spawnSync("git", [cmd, ...args], { cwd, encoding: "utf8" });
}

function suiteCommit() {
  const r = git("rev-parse", ["HEAD"], ROOT);
  return r.status === 0 ? r.stdout.trim() : "unknown";
}

function repoCommit(dir) {
  const r = git("rev-parse", ["HEAD"], dir);
  return r.status === 0 ? r.stdout.trim() : "unknown";
}

function cloneAll() {
  mkdirSync(REPOS_DIR, { recursive: true });
  for (const t of TARGETS) {
    const dir = join(REPOS_DIR, t.repo.replace("/", "__"));
    if (refresh || !existsSync(join(dir, ".git"))) {
      console.log(`\n== cloning ${t.repo} (depth 1) ==`);
      rmSync(dir, { recursive: true, force: true });
      const r = git("clone", ["--depth", "1", t.url, dir], ROOT);
      if (r.status !== 0) {
        console.error(`benchmark: clone of ${t.repo} failed: ${r.stderr}`);
        process.exit(2);
      }
    } else {
      console.log(`· ${t.repo}: clone present (pass --refresh to re-clone)`);
    }
  }
  console.log("\nbenchmark: clones ready — run without flags to scan");
}

function scanAll() {
  const results = [];
  const runAt = new Date().toISOString();
  for (const t of TARGETS) {
    const dir = join(REPOS_DIR, t.repo.replace("/", "__"));
    if (!existsSync(join(dir, ".git"))) {
      console.error(`benchmark: ${t.repo} not cloned — run with --clone first`);
      process.exit(2);
    }
    const entry = { repo: t.repo, note: t.note, commit: repoCommit(dir), runAt, suite: suiteCommit(), facets: [] };
    for (const skill of SKILLS) {
      const checker = join(ROOT, "skill", skill, "scripts", "check.mjs");
      const r = spawnSync(process.execPath, [checker, "--strict", "--json", dir], { encoding: "utf8", timeout: 300000, maxBuffer: 64 * 1024 * 1024 });
      const out = (r.stdout || "") + (r.stderr || "");
      let facet;
      if (r.status === 0 || r.status === 1) {
        let parsed = null;
        try {
          parsed = JSON.parse(r.stdout || "{}");
        } catch {
          /* non-json output — record raw */
        }
        facet = {
          skill, exit: r.status,
          files: parsed && typeof parsed.files === "number" ? parsed.files : null,
          errors: parsed && Array.isArray(parsed.errors) ? parsed.errors.length : null,
          warnings: parsed && Array.isArray(parsed.warnings) ? parsed.warnings.length : null,
        };
      } else {
        facet = { skill, exit: r.status, n_a: /no matching|no files found|usage/i.test(out), detail: out.trim().split("\n").slice(0, 1)[0] || "" };
      }
      entry.facets.push(facet);
      console.log(`  ${skill.padEnd(11)} ${JSON.stringify(facet)}`);
    }
    results.push(entry);
    mkdirSync(RESULTS_DIR, { recursive: true });
    writeFileSync(join(RESULTS_DIR, `${t.repo.replace("/", "__")}.json`), JSON.stringify(entry, null, 2) + "\n");
    console.log(`✓ ${t.repo} recorded (commit ${entry.commit.slice(0, 8)})`);
  }
  writeSummary(results);
  console.log(`\nbenchmark: ${results.length} repos scanned · results in benchmark/results/ · summary in benchmark/summary.md`);
}

function loadResults() {
  if (!existsSync(RESULTS_DIR)) return [];
  return readdirSync(RESULTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(RESULTS_DIR, f), "utf8")))
    .sort((a, b) => a.repo.localeCompare(b.repo));
}

function writeSummary(results) {
  const lines = [];
  lines.push(`# Suite benchmark — checker runs on public repositories`);
  lines.push(``);
  lines.push(`Generated ${new Date().toISOString().slice(0, 10)} · suite commit \`${suiteCommit().slice(0, 8)}\` · ` +
    `re-run: \`node scripts/benchmark.mjs --refresh\``);
  lines.push(``);
  lines.push(`Every facet checker runs with \`--strict --json\` against a shallow clone of each repo at the`);
  lines.push(`recorded commit. \`n/a\` = the checker found no files of its types (recorded honestly, never as`);
  lines.push(`clean). Mature, widely-used repos should score low on errors — the benchmark exists to prove`);
  lines.push(`the checkers run, report, and stay honest on real code.`);
  lines.push(``);
  lines.push(`| Repository | Commit | ${SKILLS.map((s) => s.slice(0, 4)).join(" | ")} |`);
  lines.push(`|---|---|${SKILLS.map(() => "---|").join("")}`);
  for (const r of results) {
    const cells = SKILLS.map((s) => {
      const f = r.facets.find((x) => x.skill === s);
      if (!f) return "—";
      if (f.n_a) return "n/a";
      if (f.errors === null) return `err${f.exit}`;
      return `**${f.errors}**/w${f.warnings}`;
    });
    lines.push(`| [${r.repo}](https://github.com/${r.repo}) | \`${r.commit.slice(0, 8)}\` | ${cells.join(" | ")} |`);
  }
  lines.push(``);
  lines.push(`Cells are **errors**/warnings (checker exit 0/1 with \`--strict\`); full findings per rule in`);
  lines.push(`\`benchmark/results/*.json\`.`);
  lines.push(``);
  writeFileSync(SUMMARY, lines.join("\n") + "\n");
}

if (clone || refresh) cloneAll();
if (!clone && !refresh && !list) scanAll();
if (list) {
  const results = loadResults();
  if (!results.length) {
    console.error("benchmark: no results yet — run with --clone, then without flags");
    process.exit(2);
  }
  console.log(`\n${results.length} repos benchmarked:`);
  for (const r of results) {
    const errs = r.facets.filter((f) => f.errors !== null && f.errors !== undefined).reduce((a, f) => a + f.errors, 0);
    const warns = r.facets.filter((f) => f.warnings !== null && f.warnings !== undefined).reduce((a, f) => a + f.warnings, 0);
    console.log(`  ${r.repo.padEnd(22)} ${String(errs).padStart(3)} errors · ${String(warns).padStart(3)} warnings · ${r.runAt.slice(0, 10)}`);
  }
  process.exit(0);
}
