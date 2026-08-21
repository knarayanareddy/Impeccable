#!/usr/bin/env node
/**
 * impc — the Impeccable craft-suite installer & router.
 *
 * The uipro-style one-command tool for this suite: installs the ten craft
 * skills into any AI harness's skills directory, lists the inventory, and
 * routes a natural-language request to the right skill + playbook using
 * the curated reference corpus (BM25-lite, zero dependencies).
 *
 * Usage:
 *   impc init --ai claude                       install all ten skills into .claude/skills
 *   impc init --ai all --skill shipcraft        install one skill everywhere
 *   impc init --ai universal --global           install into ~/.agents/skills (Agent Skills standard)
 *   impc init --ai claude --link                symlink instead of copy (dev mode)
 *   impc init --ai claude --dry-run             show the plan, write nothing
 *   impc list                                   the suite inventory (commands, refs, scenarios)
 *   impc find "the pipeline retries tests to green"    route a request to a playbook
 *   impc version
 *
 * Overwrite policy: existing installs are left untouched unless --force;
 * identical installs are reported as unchanged. A skill whose SKILL.md is
 * missing or malformed is refused, never half-installed.
 *
 * Exit codes: 0 · 1 install/find failures (e.g. skipped conflicts) · 2 usage error
 */

import { existsSync, readFileSync, readdirSync, statSync, cpSync, rmSync, symlinkSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
import { SUITE_ROOT, CANONICAL_SKILLS, listDir, walkFiles, frontmatter, commandRows, buildCorpus, rankDocs } from "./lib/corpus.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Harness target map (project mode: under cwd; global mode: under the home dir)
// ---------------------------------------------------------------------------

const TARGETS = {
  claude: { dir: ".claude/skills", label: "Claude Code" },
  codex: { dir: ".codex/skills", label: "Codex" },
  cursor: { dir: ".cursor/skills", label: "Cursor" },
  gemini: { dir: ".gemini/skills", label: "Gemini CLI" },
  universal: { dir: ".agents/skills", label: "Agent Skills standard (.agents/skills)" },
};

function usage(msg) {
  if (msg) console.error(`impc: ${msg}`);
  console.error("usage: impc init --ai <claude|codex|cursor|gemini|universal|all> [--skill <name|all>] [--global] [--link] [--force] [--dry-run]");
  console.error("       impc list [--json]");
  console.error('       impc find "<query>" [--top n] [--json]');
  console.error("       impc version | impc help");
  process.exit(2);
}

function validateSkill(skill) {
  const dir = join(SUITE_ROOT, "skill", skill);
  const skmd = join(dir, "SKILL.md");
  if (!existsSync(skmd)) return `no SKILL.md`;
  const { data } = frontmatter(readFileSync(skmd, "utf8"));
  if (!data.name || data.name !== skill) return `frontmatter name "${data.name}" != dir "${skill}"`;
  if (!data.description || data.description.length > 1024) return `description missing or over 1024 chars`;
  return null;
}

function manifestOf(dir) {
  const m = [];
  for (const f of walkFiles(dir)) {
    const rel = relative(dir, f).replaceAll("\\", "/");
    if (rel.split("/").includes("tests")) continue; // tests are never shipped
    let st;
    try {
      st = statSync(f);
    } catch {
      continue;
    }
    let hash = "";
    if (/\.md$/i.test(f)) {
      hash = createHash("sha256").update(readFileSync(f, "utf8")).digest("hex").slice(0, 16);
    }
    m.push(`${rel} ${st.size} ${hash}`);
  }
  return m.sort().join("\n");
}

function installTarget(targetDir, skills, { link, force, dryRun }) {
  const report = { installed: [], unchanged: [], skipped: [], failed: [] };
  for (const skill of skills) {
    const src = join(SUITE_ROOT, "skill", skill);
    const dest = join(targetDir, skill);
    const invalid = validateSkill(skill);
    if (invalid) {
      console.error(`impc: refusing ${skill}: ${invalid}`);
      report.failed.push(skill);
      continue;
    }
    if (existsSync(dest)) {
      if (manifestOf(dest) === manifestOf(src)) {
        console.log(`· ${skill} → unchanged (already installed, identical)`);
        report.unchanged.push(skill);
        continue;
      }
      if (!force) {
        console.log(`· ${skill} → skipped: exists and differs from the source (pass --force to overwrite)`);
        report.skipped.push(skill);
        continue;
      }
    }
    console.log(`· ${skill} → ${link ? "link" : "copy"} → ${dest}`);
    if (dryRun) {
      report.installed.push(skill);
      continue;
    }
    try {
      mkdirSync(targetDir, { recursive: true });
      rmSync(dest, { recursive: true, force: true });
    } catch (e) {
      console.error(`impc: cannot prepare ${dest}: ${e.message}`);
      report.failed.push(skill);
      continue;
    }
    if (link) {
      symlinkSync(src, dest, process.platform === "win32" ? "junction" : "dir");
    } else {
      // ship the skill, not its test harness
      cpSync(src, dest, { recursive: true, filter: (p) => !p.replaceAll("\\", "/").split("/").includes("tests") });
    }
    report.installed.push(skill);
  }
  return report;
}

function cmdInit(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i === -1 ? null : argv[i + 1];
  };
  const ai = get("--ai");
  if (!ai) usage("--ai is required (claude | codex | cursor | gemini | universal | all)");
  const keys = ai === "all" ? Object.keys(TARGETS) : [ai];
  if (keys.some((k) => !TARGETS[k])) usage(`unknown --ai "${ai}" (claude | codex | cursor | gemini | universal | all)`);
  const skillArg = get("--skill") || "all";
  const skills = skillArg === "all" ? CANONICAL_SKILLS : [skillArg];
  if (skills.some((s) => !CANONICAL_SKILLS.includes(s))) usage(`unknown --skill "${skillArg}"`);
  const global = argv.includes("--global");
  const link = argv.includes("--link");
  const force = argv.includes("--force");
  const dryRun = argv.includes("--dry-run");
  const base = global ? homedir() : process.cwd();

  let failures = 0;
  for (const key of keys) {
    const target = TARGETS[key];
    const dir = join(base, target.dir);
    console.log(`\n${target.label}: ${dir}${dryRun ? " (dry run — nothing written)" : ""}`);
    const report = installTarget(dir, skills, { link, force, dryRun });
    failures += report.skipped.length + report.failed.length;
  }
  if (failures) {
    console.error(`\nimpc: ${failures} conflict(s)/failure(s) — pass --force to overwrite, or fix the source`);
    process.exit(1);
  }
  console.log(`\nimpc: ${skills.length} skill(s) → ${keys.length} target(s) · done ✓`);
  process.exit(0);
}

function cmdList(argv) {
  const json = argv.includes("--json");
  const verify = argv.includes("--verify");
  const out = [];
  for (const skill of CANONICAL_SKILLS) {
    const dir = join(SUITE_ROOT, "skill", skill);
    const { body } = frontmatter(readFileSync(join(dir, "SKILL.md"), "utf8"));
    const refs = walkFiles(join(dir, "reference")).filter((f) => /\.md$/i.test(f)).length;
    const harness = join(dir, "tests", "scenarios.mjs");
    out.push({ skill, commands: commandRows(body).length, references: refs, harness: existsSync(harness), checks: null });
  }
  if (verify) {
    for (const s of out) {
      if (!s.harness) continue;
      const harness = join(SUITE_ROOT, "skill", s.skill, "tests", "scenarios.mjs");
      try {
        const text = execFileSync("node", [harness], { encoding: "utf8" });
        const m = /(\d+) passed,\s*(\d+) failed/.exec(text);
        s.checks = m ? parseInt(m[1], 10) : null;
      } catch {
        s.checks = null; // a red harness shows as ? — the evals runner owns the verdict
      }
    }
  }
  if (json) {
    console.log(JSON.stringify({ skills: out, total: CANONICAL_SKILLS.length }, null, 2));
  } else {
    console.log(`impeccable suite inventory${verify ? " (live harness counts)" : ""}\n`);
    console.log("SKILL         COMMANDS  REFERENCES  HARNESS  CHECKS");
    for (const s of out) {
      console.log(
        `${s.skill.padEnd(14)} ${String(s.commands).padEnd(10)} ${String(s.references).padEnd(11)} ${s.harness ? "yes" : "no".padEnd(5)}   ${verify ? s.checks ?? "?" : "· run --verify"}`
      );
    }
    console.log(`\n${out.length} skills · ${out.reduce((a, s) => a + s.commands, 0)} commands · ${out.reduce((a, s) => a + s.references, 0)} reference files${verify ? ` · ${out.reduce((a, s) => a + (s.checks ?? 0), 0)} pinned checks green` : ""}`);
  }
  process.exit(0);
}

function cmdFind(argv) {
  const qIdx = argv.findIndex((a) => !a.startsWith("--"));
  const query = qIdx === -1 ? "" : argv[qIdx];
  if (!query.trim()) usage('find needs a query: impc find "the pipeline retries tests to green"');
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i === -1 ? null : argv[i + 1];
  };
  const top = Math.min(50, parseInt(get("--top") || "8", 10) || 8);
  const json = argv.includes("--json");
  const docs = buildCorpus();
  const ranked = rankDocs(docs, query, { top });
  const results = ranked.map(({ doc, score }) => ({
    skill: doc.skill,
    file: doc.file,
    title: doc.title,
    snippet: doc.snippet,
    score: Number(score.toFixed(3)),
  }));
  const best = ranked[0] ? ranked[0].score : 0;
  if (json) {
    console.log(JSON.stringify({ query, results, strong: best >= 0.5 }, null, 2));
  } else {
    console.log(`impc find: "${query}"\n`);
    for (const r of results) {
      console.log(`${r.score.toFixed(2).padStart(6)}  ${r.skill}/${r.file}  ${r.title}`);
      if (r.snippet) console.log(`        ${r.snippet}`);
    }
    if (best < 0.5) {
      console.log("\nno strong match — the request may fall outside the suite; say so instead of guessing a skill");
    }
  }
  process.exit(0);
}

function cmdVersion() {
  let v = "1.0.0";
  try {
    const pkg = JSON.parse(readFileSync(join(SUITE_ROOT, "package.json"), "utf8"));
    v = pkg.version || v;
  } catch {
    /* repo checkout without package.json */
  }
  console.log(`impc ${v} — the Impeccable craft-suite installer & router`);
  process.exit(0);
}

const [sub, ...rest] = process.argv.slice(2);
switch (sub) {
  case "init":
    cmdInit(rest);
    break;
  case "list":
    cmdList(rest);
    break;
  case "find":
    cmdFind(rest);
    break;
  case "version":
  case "--version":
    cmdVersion();
    break;
  case "help":
  case "--help":
    usage();
    break;
  default:
    usage(sub ? `unknown command "${sub}"` : "a subcommand is required");
}
