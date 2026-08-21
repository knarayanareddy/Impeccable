#!/usr/bin/env node
/**
 * Suite data-quality gate — the corpus-integrity checker for the curated
 * knowledge (the uupm `validate-csv` / `validate-agent-guide` analog, for
 * prose). Deterministic, zero dependencies.
 *
 * Checks, per skill and suite-wide:
 *   1. The canonical ten skill directories exist (and no strays).
 *   2. SKILL.md frontmatter: name matches the dir, description present and
 *      within the Agent Skills 1024-char limit, user-invocable set.
 *   3. Commands table: every row's linked reference file exists; the row
 *      count is non-trivial.
 *   4. Reachability: every .md under reference/ and assets/ is linked from
 *      some file in the skill (SKILL.md or a reference file) — unreferenced
 *      knowledge is dead knowledge.
 *   5. Every relative link in the skill's markdown resolves.
 *   6. Every code-mention of scripts/*.mjs, assets/* and domains/* resolves.
 *   7. Suite completion (when <root>/docs exists): per-skill docs page +
 *      case study, demo runner, test harness, and both review-round archives.
 *   8. The docs home links every skill page; the README links every skill's
 *      docs page and demo runner.
 *
 * Usage:
 *   node scripts/data-quality.mjs [--root <suite-root>] [--json]
 *
 * Exit codes: 0 corpus clean · 1 findings · 2 usage error
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SUITE_ROOT, CANONICAL_SKILLS, listDir, walkFiles, frontmatter,
  commandRows, mdLinks, backtickPaths, readText,
} from "./lib/corpus.mjs";

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const rootArg = get("--root");
const json = argv.includes("--json");
const root = rootArg ? resolve(rootArg) : SUITE_ROOT;
if (!existsSync(join(root, "skill"))) {
  console.error(`data-quality: no skill/ directory under ${root}`);
  process.exit(2);
}
const explicitRoot = Boolean(rootArg);

const findings = [];
const find = (check, path, message) => findings.push({ check, path, message });

function resolveRef(fromFile, link, skillDir, { soft = false } = {}) {
  if (/^https?:/i.test(link)) return null; // `http.md` is a file, not a URL
  let clean = link.split("#")[0];
  if (!clean.includes("/") && !clean.includes("\\")) {
    // bare name — a vocabulary shorthand like `structure.md` or an example
    // filename like `slo.yaml`. It resolves within the skill by basename;
    // an unresolved bare name is shorthand, not a defect (soft).
    const base = basename(clean);
    for (const f of walkFiles(skillDir)) {
      if (basename(f) === base) return f;
    }
    return soft ? null : null;
  }
  const cands = [
    resolve(dirname(fromFile), clean),
    join(skillDir, "reference", clean), // files under reference/ link reference/-relative
    join(skillDir, clean),
    join(root, clean),
  ];
  if (clean && !clean.endsWith("/") && !/\.(md|mjs|cjs|json|yml|yaml)$/i.test(clean)) {
    cands.push(...cands.slice(0, 2).map((c) => `${c}.md`)); // path shorthand: domains/errors → domains/errors.md
  }
  // cross-skill references: `domains/abuse.md` from apicraft lives in seccraft
  for (const other of listDir(join(root, "skill"))) {
    if (other === basename(skillDir)) continue;
    cands.push(join(root, "skill", other, "reference", clean));
    cands.push(join(root, "skill", other, clean));
    if (clean && !clean.endsWith("/") && !/\.(md|mjs|cjs|json|yml|yaml)$/i.test(clean)) {
      cands.push(join(root, "skill", other, "reference", `${clean}.md`));
    }
  }
  for (const candidate of cands) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1. Skill inventory
// ---------------------------------------------------------------------------

const skillDirs = listDir(join(root, "skill")).filter((s) => statSync(join(root, "skill", s)).isDirectory());
if (!explicitRoot) {
  for (const s of CANONICAL_SKILLS) {
    if (!skillDirs.includes(s)) find("inventory", `skill/${s}`, `missing canonical skill directory "${s}"`);
  }
  for (const s of skillDirs) {
    if (!CANONICAL_SKILLS.includes(s)) find("inventory", `skill/${s}`, `stray directory — not one of the ten canonical skills`);
  }
}
const skills = explicitRoot ? skillDirs : CANONICAL_SKILLS.filter((s) => skillDirs.includes(s));

// ---------------------------------------------------------------------------
// Per-skill checks
// ---------------------------------------------------------------------------

const ALL_FILES = new Map(); // skill -> {rel: abs}

function indexSkillFiles(skill) {
  const dir = join(root, "skill", skill);
  const map = {};
  for (const f of walkFiles(dir)) {
    const rel = relative(dir, f).replaceAll("\\", "/");
    map[rel] = f;
    ALL_FILES.set(f, rel);
  }
  return { dir, map };
}

for (const skill of skills) {
  const { dir, map } = indexSkillFiles(skill);
  const skmd = join(dir, "SKILL.md");
  if (!map["SKILL.md"]) {
    find("frontmatter", `skill/${skill}`, "no SKILL.md");
    continue;
  }
  const skillText = readText(skmd);
  const { data, body } = frontmatter(skillText);

  // 2. frontmatter
  if (data.name !== skill) find("frontmatter", `skill/${skill}/SKILL.md`, `frontmatter name "${data.name}" != directory "${skill}"`);
  if (!data.description) find("frontmatter", `skill/${skill}/SKILL.md`, "description missing");
  else if (data.description.length > 1024) find("frontmatter", `skill/${skill}/SKILL.md`, `description is ${data.description.length} chars (spec limit 1024)`);
  if (data["user-invocable"] !== "true") find("frontmatter", `skill/${skill}/SKILL.md`, `user-invocable must be "true" (got "${data["user-invocable"]}")`);

  // 3. commands table
  const rows = commandRows(body);
  if (rows.length < 5) find("commands", `skill/${skill}/SKILL.md`, `only ${rows.length} command row(s) — the table looks truncated`);
  for (const r of rows) {
    if (!r.primary) {
      find("commands", `skill/${skill}/SKILL.md`, `command "${r.cmd}" has no linked reference`);
      continue;
    }
    const target = resolveRef(skmd, r.primary, dir);
    if (!target || !target.startsWith(dir)) {
      find("commands", `skill/${skill}/SKILL.md`, `command "${r.cmd}" links missing file ${r.primary}`);
    }
  }

  // 4+5. link graph: every link/backtick path resolves; every reference/ +
  // assets/ knowledge file is reachable from SKILL.md or another file
  const referenced = new Set();
  const mdFiles = Object.values(map).filter((f) => /\.md$/i.test(f));
  for (const f of mdFiles) {
    const text = readText(f);
    const refs = new Set([...mdLinks(text), ...backtickPaths(text)]);
    for (const m of text.matchAll(/[`\s(]([\w./-]*\/?(?:domains|reference|assets|scripts|extension|idioms|styles|engines|frameworks|measurement|surfaces|platforms|pillars|environments)\/(?:[\w./-]+\.(?:md|mjs|cjs|json|yml|yaml)|[\w.-]+\/))/g)) {
      if (/^[\w.-]+\.(com|org|io|net|dev|cc|sh|ai|me)\//.test(m[1])) continue; // URL tail
      refs.add(m[1].replace(/[.,;:)]+$/, "")); // prose mentions like `per domains/accessibility.md`
    }
    for (const link of refs) {
      const isBare = !link.includes("/") && !link.includes("\\");
      const target = resolveRef(f, link, dir, { soft: isBare });
      if (!target) {
        if (!isBare) find("links", relative(root, f), `unresolved reference "${link}"`);
        continue;
      }
      const rel = relative(dir, target).replaceAll("\\", "/");
      if (rel.startsWith("..") || !existsSync(target)) continue;
      if (statSync(target).isDirectory()) {
        // a directory mention references every knowledge file under it
        for (const k of Object.keys(map)) {
          if (k.startsWith(rel.replaceAll("\\", "/") + "/") || k === rel) referenced.add(k);
        }
      } else if (map[rel]) {
        referenced.add(rel);
      }
    }
  }
  for (const rel of Object.keys(map)) {
    if (!/\.md$/i.test(rel)) continue;
    if (rel === "SKILL.md" || rel.includes("tests/")) continue; // root entry + harness fixtures
    const inKnowledge = rel.startsWith("reference/") || rel.startsWith("assets/") || rel.startsWith("extension/");
    if (inKnowledge && !referenced.has(rel)) {
      find("reachability", `skill/${skill}/${rel}`, "unreferenced knowledge file — link it from SKILL.md or a reference");
    }
  }

  // 6. code mentions of scripts/assets/domains paths resolve
  for (const f of mdFiles) {
    const text = readText(f);
    for (const m of text.matchAll(/[`(]?([\w./-]*scripts\/[\w./-]+\.mjs|[a-z]*\/?assets\/[\w./-]+|[a-z]*\/?domains\/[\w./-]+\.md)[`)]?/g)) {
      const p = m[1];
      if (p.startsWith("http")) continue;
      if (p.startsWith("<")) continue; // <skill-dir> placeholders
      if (!resolveRef(f, p, dir)) {
        find("mentions", relative(root, f), `mentions missing path "${p}"`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Suite completion (real suite only)
// ---------------------------------------------------------------------------

const hasDocs = existsSync(join(root, "docs", "index.html"));
if (hasDocs) {
  for (const skill of skills) {
    for (const [check, rel] of [
      ["docs", `docs/${skill}/index.html`],
      ["docs", `docs/${skill}/case-study.md`],
      ["demos", `demos/${skill}/run-demo.mjs`],
      ["harness", `skill/${skill}/tests/scenarios.mjs`],
      ["reviews", `REVIEWS/${skill}-round1.md`],
      ["reviews", `REVIEWS/${skill}-round2.md`],
      ["reviews", `REVIEWS/${skill}-launch-round1.md`],
      ["reviews", `REVIEWS/${skill}-launch-round2.md`],
    ]) {
      if (!existsSync(join(root, rel))) find(check, rel, "missing suite artifact");
    }
  }

  // 8. docs home + README link every skill
  const docsIndex = readText(join(root, "docs", "index.html"));
  for (const skill of skills) {
    if (!docsIndex.includes(`href="${skill}/"`)) find("docs-home", "docs/index.html", `no link to ${skill}'s page`);
  }
  const readme = existsSync(join(root, "README.md")) ? readText(join(root, "README.md")) : "";
  for (const skill of skills) {
    if (!readme.includes(`docs/${skill}/`)) find("readme", "README.md", `no docs link for ${skill}`);
    if (!readme.includes(`demos/${skill}/run-demo.mjs`)) find("readme", "README.md", `no demo link for ${skill}`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const byCheck = {};
for (const f of findings) (byCheck[f.check] ??= []).push(f);

if (json) {
  console.log(JSON.stringify({ root: explicitRoot ? root : "(suite root)", skills, findings, findingCount: findings.length }, null, 2));
} else {
  if (!findings.length) {
    console.log(`data-quality: ${skills.length} skill(s) · ${ALL_FILES.size} files · corpus clean ✓`);
  } else {
    for (const [check, list] of Object.entries(byCheck)) {
      console.log(`\n-- ${check} (${list.length})`);
      for (const f of list) console.log(`  ${f.path}: ${f.message}`);
    }
    console.log(`\ndata-quality: ${findings.length} finding(s) · FAILED`);
  }
}
process.exit(findings.length ? 1 : 0);
