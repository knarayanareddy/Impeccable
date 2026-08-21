#!/usr/bin/env node
/**
 * Criterion deterministic checker.
 *
 * Scans frontend files for the "tool-slop" anti-patterns in
 * reference/anti-patterns.md. Zero dependencies, no LLM, no API key.
 *
 * Usage:
 *   node check.mjs                     scan the project root (cwd)
 *   node check.mjs <paths...>          scan specific files/directories
 *   node check.mjs --strict            treat warnings as failures
 *   node check.mjs --json              machine-readable output
 *
 * Exit codes: 0 clean · 1 errors found · 2 usage error
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, relative, extname, basename } from "node:path";

const EXTS = new Set([
  ".html", ".htm", ".css", ".scss", ".sass", ".less",
  ".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".astro", ".mdx",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage",
  ".next", ".nuxt", ".output", "vendor", ".venv",
]);

// ---------------------------------------------------------------------------
// Rules. Each rule: id, severity ('error'|'warning'), test(line) -> msg|null
// ---------------------------------------------------------------------------

const rules = [
  {
    id: "banned-font",
    severity: "warning",
    message: "Banned default font. Choose a deliberate typeface (see domains/typography.md) or record the reason.",
    test(line) {
      if (!/font-family/i.test(line)) return null;
      const m = /(?:Inter|Roboto|Arial|Helvetica|Open Sans|Lato|Montserrat|Poppins)/i.exec(line);
      if (!m) return null;
      // Allow the mention if it's inside a fallback stack *after* a chosen family
      const before = line.slice(0, m.index);
      if (/font-family\s*:[^;]*['"]?(?:IBM Plex|Public Sans|Source Sans|JetBrains|Space Grotesk|Sora|Manrope|Geist|Fraunces|Bricolage|Instrument|Suisse|Untitled)/i.test(before)) return null;
      return `font family "${m[0]}"`;
    },
  },
  {
    id: "pure-black",
    severity: "error",
    message: "Pure black (#000). Use a tinted near-black (domains/color.md). Shadows with alpha are exempt.",
    test(line) {
      // Hex / named / opaque rgb black. Skip rgba(0,0,0,<1) and shadow contexts — shadows are layers, not surfaces.
      if (/#000\b|#000000\b|\bblack\b/i.test(line)) {
        if (/box-shadow/i.test(line)) return null;
        return line.trim().slice(0, 120);
      }
      const opaque = /rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*1\s*\)/i.exec(line);
      if (opaque) return line.trim().slice(0, 120);
      return null;
    },
  },
  {
    id: "pure-gray-text",
    severity: "warning",
    message: "Pure gray commonly used as text — almost always fails 4.5:1 on light surfaces. Tint it toward the surface hue.",
    test(line) {
      const grays = /#(?:808080|6b7280|9ca3af|a1a1aa|71717a|999999|888888|777777|666666)\b/i.exec(line);
      if (!grays) return null;
      // Likely a text/foreground context?
      if (/\b(?:color|text|fill)\b/i.test(line) || /text-/i.test(line)) {
        return grays[0];
      }
      return null;
    },
  },
  {
    id: "gray-on-color",
    severity: "warning",
    message: "Gray likely set on a tinted/colored background — a classic contrast failure. Verify the pair ≥ 4.5:1.",
    test(line) {
      if (!/background(?:-color)?\s*[:"']/i.test(line)) return null;
      const hexes = line.match(/#[0-9a-f]{6}\b/gi) || [];
      const grays = hexes.filter((h) => /^(#(?:808080|6b7280|9ca3af|a1a1aa|71717a|999999|888888|777777|666666))$/i.test(h));
      // A background is "colored" only if it has real chroma (channel spread ≥ 0x20)
      const isNeutral = (h) => {
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
        return Math.max(r, g, b) - Math.min(r, g, b) < 0x20;
      };
      const colored = hexes.filter((h) => !isNeutral(h));
      if (grays.length && colored.length) return `${grays[0]} on ${colored[0]}`;
      return null;
    },
  },
  {
    id: "radius-too-large",
    severity: "warning",
    message: "Radius ≥16px (rounded-2xl) on a data-dense region. 4–8px belongs in Command/Configure registers (craft-floor.md).",
    test(line) {
      const avatarCtx = /(avatar|image|img|icon|logo|profile|photo|thumb)/i.test(line);
      if (/rounded-full/i.test(line) && avatarCtx) return null;
      if (/rounded-(?:2xl|3xl|full)/i.test(line)) return line.trim().slice(0, 120);
      const m = /border-?radius\s*:\s*['"]?\s*([\d.]+)\s*(px|rem)/i.exec(line);
      if (!m) return null;
      const val = parseFloat(m[1]);
      const px = m[2] === "rem" ? val * 16 : val;
      if (px >= 100 && avatarCtx) return null; // fully-round avatar/icon pill
      return px >= 16 ? `${m[1]}${m[2]}` : null;
    },
  },
  {
    id: "elastic-easing",
    severity: "error",
    message: "Bounce/elastic/back easing — reads as a toy in tools (domains/motion.md). Use cubic-bezier with values in [0,1], ease-out style.",
    test(line) {
      const named = /(?:easeInBack|easeOutBack|easeInOutBack|easeInElastic|easeOutElastic|easeInOutElastic|easeInBounce|easeOutBounce|easeInOutBounce)\b/i.exec(line);
      if (named) return named[0];
      const bez = /cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/i.exec(line);
      if (bez) {
        const [, a, b, c, d] = bez.map(Number);
        if (a < 0 || b < 0 || c < 0 || d < 0 || a > 1 || b > 1 || c > 1 || d > 1) {
          return `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
        }
      }
      return null;
    },
  },
  {
    id: "purple-blue-gradient",
    severity: "error",
    message: "Purple→blue gradient — the category-level AI fingerprint (anti-patterns.md C1).",
    test(line) {
      if (!/gradient/i.test(line)) return null;
      const purple = /#(?:6366f1|8b5cf6|7c3aed|a855f7|4f46e5|6d28d9|9333ea)\b/i.test(line);
      const blue = /#(?:3b82f6|2563eb|1d4ed8|0ea5e9|60a5fa)\b/i.test(line);
      const named = /\b(?:violet|purple|indigo)\b/i.test(line) && /\b(?:blue|sky)\b/i.test(line);
      if ((purple && blue) || named) return line.trim().slice(0, 120);
      return null;
    },
  },
  {
    id: "transition-all",
    severity: "warning",
    message: "`transition: all` — slow and unfocused. Transition the specific property (domains/motion.md).",
    test(line) {
      return /transition\s*:\s*['"]?\s*all\b/i.test(line) ? line.trim().slice(0, 120) : null;
    },
  },
  {
    id: "slow-feedback",
    severity: "warning",
    message: "Animation/transition >500ms on feedback — task motion must be ≤300ms (craft-floor.md).",
    test(line) {
      // Tailwind duration-XXX / duration-[XXXms]
      const tw = /duration[-[]\s*(\d+)\s*(ms)?/i.exec(line);
      if (tw) {
        return parseInt(tw[1], 10) > 500 ? `${tw[1]}${tw[2] || "ms"}` : null;
      }
      // CSS declarations: transition: ... 1.2s ... / animation: ... 1.2s ...
      const m = /(?:transition|animation)[^;{]*?([\d.]+)\s*(ms|s)\b/i.exec(line);
      if (!m) return null;
      const val = parseFloat(m[1]) * (m[2].toLowerCase() === "s" ? 1000 : 1);
      return val > 500 ? `${val}ms` : null;
    },
  },
  {
    id: "deprecated-motion",
    severity: "error",
    message: "<blink>/<marquee> — removed/obsolete elements; cut them.",
    test(line) {
      return /<\/?(?:blink|marquee)\b/i.test(line) ? line.trim().slice(0, 120) : null;
    },
  },
  {
    id: "commented-out-code",
    severity: "warning",
    message: "Commented-out code — git remembers, the file must not. Delete the block.",
    // HTML comments stay line-based; /* */ blocks are handled by the file-level pass below.
    test(line) {
      const m = /^\s*<!--\s?(.*)$/.exec(line);
      if (!m) return null;
      const s = m[1].trim().replace(/-->\s*$/, "").trim();
      if (!s) return null;
      if (/[{][^}]*[}]/.test(s) || /[a-z-]+\s*:\s*[^;]+;/.test(s) || /^[.#a-z][\w.#-]*\s*[{,]/i.test(s)) {
        return s.slice(0, 100);
      }
      return null;
    },
  },
];

const CSS_SHAPE = /[{][^}]*[}]|[a-z-]+\s*:\s*[^;]+;|^[.#a-z][\w.#-]*\s*[{,]/im;

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
      console.error(`criterion: cannot read ${p}`);
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

function scan(file, strict) {
  const findings = [];
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return findings;
  }
  const rawLines = text.split("\n");
  // Stateful comment stripping (multi-line blocks): comments are prose, not evidence.
  const lines = [];
  let inBlock = false;
  for (const raw of rawLines) {
    let line = raw;
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
      } else if (/\.(js|mjs|cjs|jsx|ts|tsx|vue|svelte)$/i.test(file) && line.startsWith("//", i) && (i === 0 || line[i - 1] !== ":")) {
        break; // rest of the line is a comment (URLs keep their // — string evidence survives)
      } else if (/\.html?$/i.test(file) && line.startsWith("<!--", i)) {
        const end = line.indexOf("-->", i + 4);
        out += " ".repeat(end === -1 ? line.length - i : end + 3 - i);
        i = end === -1 ? line.length : end + 3;
      } else {
        out += line[i];
        i += 1;
      }
    }
    lines.push(out);
  }
  lines.forEach((rawLine, i) => {
    const line = rawLine;
    const raw = rawLines[i];
    for (const rule of rules) {
      const subject = rule.id === "commented-out-code" ? raw : line;
      const detail = rule.test(subject);
      if (detail) {
        findings.push({
          file: basename(file),
          line: i + 1,
          rule: rule.id,
          severity: rule.severity,
          message: rule.message,
          detail,
        });
      }
    }
  });
  // Block comments: prose-led multi-line blocks hide CSS shapes the line rule can't see
  if (/\.(css|scss|sass|less|html?|vue|svelte|astro)$/i.test(file)) {
    const re = /\/\*([\s\S]*?)\*\//g;
    let m;
    while ((m = re.exec(text))) {
      const s = m[1].trim();
      if (!s || s.length < 3) continue;
      if (CSS_SHAPE.test(s)) {
        const lineNo = text.slice(0, m.index).split("\n").length;
        findings.push({
          file: basename(file), line: lineNo, rule: "commented-out-code", severity: "warning",
          message: "Commented-out code — git remembers, the file must not. Delete the block.",
          detail: s.slice(0, 100),
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
    console.error("criterion: no matching frontend files found");
    process.exit(2);
  }

  const all = [];
  for (const f of files) {
    const findings = scan(f, strict);
    for (const fnd of findings) {
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
      `\ncriterion: ${files.length} file(s) scanned · ${errors.length} error(s), ${warnings.length} warning(s)` +
        (strict ? " (--strict: warnings fail)" : "") +
        (failed ? ` · FAILED` : warnings.length ? " · warnings only (run with --strict to fail)" : " · clean ✓")
    );
  }
  process.exitCode = failed ? 1 : 0;
}

main();
