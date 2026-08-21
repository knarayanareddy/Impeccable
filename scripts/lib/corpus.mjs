/**
 * Corpus utilities shared by the suite tools — impc find (the router),
 * evaluate-relevance.mjs (the routing evals), and data-quality.mjs (the
 * corpus integrity gate). Zero dependencies, node stdlib only.
 *
 * The "curated data" of this suite is the ten skills' reference knowledge:
 * SKILL.md command tables + reference/*.md. This module turns that corpus
 * into indexable documents and scores them with a BM25-lite ranker, so the
 * suite's vocabulary can route a natural-language request to the right
 * skill and playbook — deterministically, like uupm's search.py + evals.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SUITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const CANONICAL_SKILLS = [
  "criterion", "codecraft", "apicraft", "dbcraft", "testcraft",
  "perfcraft", "seccraft", "obscraft", "shipcraft", "bugcraft",
];

export const STOPWORDS = new Set(`
a an and are as at be but by can could did do does for from had has have he her his how
i if in into is it its like may me might more most must my no not of on or our out over
should so some such than that the their them then there these they this those to under
until up use we what when where which while who why will with would you your yours
just really very about get got need want please let run see look try make made new any
`.trim().split(/\s+/));

export function readText(p) {
  return readFileSync(p, "utf8");
}

export function listDir(p) {
  try {
    return readdirSync(p).sort();
  } catch {
    return [];
  }
}

export function walkFiles(dir, acc = [], depth = 0, seen = new Set()) {
  if (depth > 8) return acc;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".git") continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    // dev:ino keyed — a symlink cycle terminates, and the same file reached
    // twice through symlinks counts once (manifest determinism)
    const key = `${st.dev}:${st.ino}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (st.isDirectory()) walkFiles(p, acc, depth + 1, seen);
    else acc.push(p);
  }
  return acc;
}

export function frontmatter(text) {
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?/.exec(text);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = /^\s*([\w-]+)\s*:\s*(.*)\s*$/.exec(line);
    if (kv) data[kv[1]] = kv[2];
  }
  return { data, body: text.slice(m[0].length) };
}

/** Extract markdown links (relative targets only; http/#/mailto skipped). */
export function mdLinks(text) {
  const links = [];
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const t = m[1].replace(/[<>]/g, "");
    if (/^(https?:|#|mailto:)/i.test(t)) continue;
    links.push(t);
  }
  return links;
}

/** Extract backtick-wrapped relative file paths (`reference/commands/x.md`). */
export function backtickPaths(text) {
  const paths = [];
  for (const m of text.matchAll(/`([a-z0-9_][\w./-]*\.(?:md|mjs|cjs|json|yml|yaml))`/g)) {
    paths.push(m[1]);
  }
  return paths;
}

/** Parse the Commands table rows of a SKILL.md body. */
export function commandRows(skillMdBody) {
  const rows = [];
  for (const line of skillMdBody.split("\n")) {
    const m = /^\|\s*`([^`]+)`\s*\|([^|]*)\|([^|]*?)\|(.*?)\|\s*$/.exec(line);
    if (!m) continue;
    if (m[1].trim().toLowerCase() === "command") continue; // header row
    // Reference cells use either markdown links or backtick paths
    const links = mdLinks(m[4]);
    const ticks = backtickPaths(m[4]).filter((p) => !/^http/i.test(p));
    rows.push({ cmd: m[1].trim(), category: m[2].trim(), what: m[3].trim(), links, ticks, primary: links[0] || ticks[0] || null });
  }
  return rows;
}

/**
 * Conservative stemmer — merges the inflections that matter for routing
 * (dense/denser, flaky/flakiness, falsify/falsification) without the
 * aggressive errors of full Porter. Only applies to tokens length >= 5.
 */
export function stem(t) {
  if (t.length < 5) return t;
  return t
    .replace(/ies$/, "y")
    .replace(/(ss|sh|ch|zz)es$/, "$1")
    .replace(/es$/, "")
    .replace(/s$/, "")
    .replace(/ing$/, "")
    .replace(/ed$/, "")
    .replace(/er$/, "")
    .replace(/ly$/, "");
}

/** Curated word-family map — merges the noun/verb/adjective families that
 * suffix rules miss (densify/dense/density, migrate/migration, cache/caching…). */
export const SYNONYM_STEMS = new Map(Object.entries({
  densify: "dens", density: "dens", dense: "dens", denser: "dens",
  caching: "cach", cache: "cach", cached: "cach",
  secrets: "secret",
  logging: "log", logs: "log",
  alerting: "alert", alerts: "alert",
  migration: "migrat", migrate: "migrat", migrations: "migrat", migrated: "migrat",
  flakiness: "flaki", flaky: "flaki",
  alignment: "align", aligned: "align",
  bisection: "bisect", bisecting: "bisect",
  mocking: "mock", mocks: "mock", mocked: "mock",
  reproduction: "reproduc", reproducible: "reproduc", reproduce: "reproduc", repro: "reproduc",
  diagnosis: "diagnos", diagnose: "diagnos", diagnosing: "diagnos",
  recovery: "recover", recoverable: "recover",
  constraints: "constrain", constraint: "constrain",
  indexes: "index", indexing: "index", indexed: "index",
  determinism: "determin", deterministic: "determin",
  nesting: "nest", nested: "nest",
  authorization: "authoriz", authz: "authoriz", authorize: "authoriz",
  observability: "observ",
  availability: "avail",
  pagination: "paginat", paginate: "paginat", paginated: "paginat",
  verification: "verifi", verified: "verifi", verify: "verifi", verifying: "verifi",
  validation: "validat", validate: "validat", validated: "validat",
  normalization: "normaliz", normalize: "normaliz", normalized: "normaliz",
  instrumentation: "instrument",
  correlation: "correlat", correlate: "correlat",
  compression: "compress",
  encryption: "encrypt", encrypted: "encrypt",
  authentication: "authentic", authn: "authentic",
  configuration: "configur",
  deployment: "deploy", deploys: "deploy", deployed: "deploy",
  performance: "perform",
  requirement: "requir", requirements: "requir",
  dependency: "depend", dependencies: "depend",
  integration: "integr",
  duration: "durat",
  consistency: "consist", consistent: "consist",
  accessibility: "accessib",
  responsive: "respons",
  visualization: "visualiz", visualize: "visualiz",
  documentation: "document", documented: "document",
  measurements: "measur", measurement: "measur", measure: "measur", measured: "measur",
  rollbacks: "rollback", rollback: "rollback",
}));

export function tokenize(text, { stemWords = false } = {}) {
  const tokens = (String(text).toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  if (!stemWords) return tokens;
  return tokens.map((t) => SYNONYM_STEMS.get(stem(t)) || stem(t));
}

function headingsOf(body) {
  return body.split("\n")
    .filter((l) => /^#{1,4}\s+/.test(l))
    .map((l) => l.replace(/^#{1,4}\s+/, "").trim())
    .join(" · ");
}

function snippetOf(body) {
  const line = body.split("\n").find((l) => l.trim().length > 8 && !l.trim().startsWith("#"));
  return line ? line.trim().slice(0, 180) : "";
}

function mkDoc({ skill, file, title, desc = "", cmdWhat = "", headings = "", body = "" }) {
  const fields = [
    { key: "title", w: 4, tokens: tokenize(title, { stemWords: true }) },
    { key: "desc", w: 2.5, tokens: tokenize(desc, { stemWords: true }) },
    { key: "cmdWhat", w: 3, tokens: tokenize(cmdWhat, { stemWords: true }) },
    { key: "headings", w: 2, tokens: tokenize(headings, { stemWords: true }) },
    { key: "body", w: 1, tokens: tokenize(body, { stemWords: true }) },
  ];
  const allTokens = new Set();
  let dl = 0;
  for (const f of fields) {
    for (const t of f.tokens) allTokens.add(t);
    dl += f.tokens.length;
  }
  return {
    id: `${skill}:${file}`, skill, file, title, snippet: snippetOf(body),
    fields, allTokens, dl,
    raw: `${title} ${desc} ${cmdWhat} ${headings} ${body}`.toLowerCase().replace(/[^a-z0-9]+/g, " "),
  };
}

/**
 * Build the routing corpus: one doc per SKILL.md (skill-level) and one per
 * reference/*.md file, with command-table rows boosting their primary
 * reference file's title field (the command's name + what-it-does).
 */
export function buildCorpus(root = SUITE_ROOT) {
  const skillRoot = join(root, "skill");
  const docs = [];
  for (const skill of listDir(skillRoot)) {
    const dir = join(skillRoot, skill);
    const skmd = join(dir, "SKILL.md");
    if (!existsSync(skmd)) continue;
    const { data, body } = frontmatter(readText(skmd));
    const rows = commandRows(body);
    const cmdByFile = new Map();
    for (const r of rows) {
      if (r.primary) cmdByFile.set(resolve(dir, r.primary), r);
    }
    docs.push(mkDoc({ skill, file: "SKILL.md", title: skill, desc: data.description || "", headings: headingsOf(body), body }));
    const refRoot = join(dir, "reference");
    for (const f of walkFiles(refRoot)) {
      if (!/\.md$/i.test(f)) continue;
      const relp = ("reference/" + f.slice(refRoot.length + 1)).replaceAll("\\", "/");
      const { body: b } = frontmatter(readText(f));
      const title = (/^#\s+(.+)$/m.exec(b) || [])[1] || relp;
      const row = cmdByFile.get(f);
      docs.push(mkDoc({
        skill, file: relp, title,
        cmdWhat: row ? `${row.cmd} ${row.what}` : "",
        headings: headingsOf(b), body: b,
      }));
    }
  }
  return docs;
}

/**
 * BM25-lite ranker over the corpus docs. Query tokens hit per-field tf with
 * field weights; the title/command fields dominate, so routing answers are
 * vocabulary-driven rather than body-noise-driven.
 */
export function rankDocs(docs, query, { top = 10 } = {}) {
  const q = tokenize(query, { stemWords: true });
  if (!q.length) return [];
  const rawQuery = String(query).toLowerCase().match(/[a-z0-9]+/g) || [];
  const phrases = [];
  for (let i = 0; i + 1 < rawQuery.length; i++) {
    const p = `${rawQuery[i]} ${rawQuery[i + 1]}`;
    if (!STOPWORDS.has(rawQuery[i]) || !STOPWORDS.has(rawQuery[i + 1])) phrases.push(p);
  }
  const N = docs.length;
  const df = new Map();
  for (const d of docs) {
    for (const t of d.allTokens) df.set(t, (df.get(t) || 0) + 1);
  }
  const avgdl = docs.reduce((s, d) => s + d.dl, 0) / Math.max(1, N);
  const idf = (t) => Math.log(1 + (N - (df.get(t) || 0) + 0.5) / ((df.get(t) || 0) + 0.5));
  const K1 = 1.2;
  const B = 0.75;
  const scored = docs.map((d) => {
    let s = 0;
    const norm = 1 - B + (B * d.dl) / Math.max(1, avgdl);
    for (const f of d.fields) {
      for (const t of q) {
        const tf = f.tokens.filter((x) => x === t).length;
        if (!tf) continue;
        s += idf(t) * ((tf * (K1 + 1)) / (tf + K1 * norm)) * f.w;
      }
    }
    // exact-phrase evidence: "sequential scan", "tabular figures" — a
    // verbatim bigram is stronger than its tokens scattered
    for (const p of phrases) {
      if (d.raw.includes(p)) s += 2.5;
    }
    return { doc: d, score: s };
  }).sort((a, b) => b.score - a.score);
  return scored.slice(0, top);
}
