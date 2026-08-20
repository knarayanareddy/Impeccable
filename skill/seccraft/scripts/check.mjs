#!/usr/bin/env node
/**
 * Seccraft deterministic checker.
 *
 * Scans source and config files for the security-slop anti-patterns in
 * reference/anti-patterns.md. Zero dependencies, no LLM, no API key.
 *
 * Usage:
 *   node check.mjs                     scan the project root (cwd)
 *   node check.mjs <paths...>          scan specific files/directories
 *   node check.mjs --strict            treat warnings as failures
 *   node check.mjs --json              machine-readable output
 *
 * Exit codes: 0 clean · 1 findings at/above the failure threshold · 2 usage error
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, relative, extname, basename } from "node:path";

const CODE_EXTS = new Set([
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx",
  ".py", ".go", ".java", ".rb", ".php",
  ".cs", ".rs", ".swift", ".kt", ".kts",
  ".html", ".htm", ".vue", ".svelte", ".yaml", ".yml", ".env",
]);
const EXTS = new Set([...CODE_EXTS]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage", "target",
  ".next", ".nuxt", ".output", "vendor", ".venv", "__pycache__",
]);

// ---------------------------------------------------------------------------
// Line rules
// ---------------------------------------------------------------------------

const rules = [
  {
    id: "hardcoded-credential",
    severity: "error",
    message: "Hardcoded credential in code — the first thing attackers grep (S1). Move to a secret manager and rotate. Value redacted.",
    test(line) {
      const m = /((?:api[_-]?key|api[_-]?secret|secret[_-]?key|client[_-]?secret|password|passwd|access[_-]?token|auth[_-]?token|bearer[_-]?token|db[_-]?password|jwt[_-]?secret|signing[_-]?key))\s*[:=]\s*["']([A-Za-z0-9_\-+./=]{8,})["']/i.exec(line);
      if (!m) return null;
      const val = m[2];
      if (/^(changeme|password|secret|example|dummy|test|testing|x{8,}|12345678|your[-_])$/i.test(val)) return null;
      if (/[<>{}]/.test(val)) return null; // a template placeholder, not a value
      return `${m[1]} = "<redacted>"`;
    },
    testFallback(line) {
      // .env-style unquoted form: `API_KEY=sk-abc123...`
      const m = /^\s*((?:api[_-]?key|api[_-]?secret|secret[_-]?key|client[_-]?secret|password|passwd|access[_-]?token|auth[_-]?token|db[_-]?password|jwt[_-]?secret|signing[_-]?key))\s*=\s*([A-Za-z0-9_\-+./=]{8,})\s*$/i.exec(line);
      if (!m) return null;
      if (/^(changeme|password|secret|example|dummy|test|testing|x{8,}|12345678)$/i.test(m[2])) return null;
      if (/[<>{}]/.test(m[2])) return null;
      return `${m[1]} = "<redacted>"`;
    },
    testFallback2(line) {
      // env-fallback form: `const key = process.env.KEY || "sk-..."` — the
      // fallback IS a committed credential (cross-skill parity with apicraft)
      const m = /\b(api[_-]?key|api[_-]?secret|secret[_-]?key|client[_-]?secret|password|passwd|access[_-]?token|auth[_-]?token|db[_-]?password|jwt[_-]?secret|signing[_-]?key)\b[^=]*=\s*[^;]*\|\|\s*["']([A-Za-z0-9_\-+./=]{8,})["']/i.exec(line);
      if (!m) return null;
      if (/^(changeme|password|secret|example|dummy|test|testing|x{8,}|12345678)$/i.test(m[2])) return null;
      return `${m[1]} ||= "<redacted>"`;
    },
  },
  {
    id: "committed-private-key",
    severity: "error",
    message: "Private key material in the repo — rotate immediately and scrub history (S2).",
    test(line) {
      return /-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/.test(line) ? "PRIVATE KEY" : null;
    },
  },
  {
    id: "interpolated-sql",
    severity: "error",
    message: "String-built SQL from inputs — SQL injection (I1). Bound parameters, everywhere.",
    test(line) {
      if (/(f["']|`)\s*[A-Z\s]*\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(line) && /[{}$]/.test(line)) return "interpolated SQL";
      if (/(["'])\s*(SELECT|INSERT|UPDATE|DELETE)\b/i.test(line) && /\+\s*\w/.test(line)) return "concatenated SQL";
      if (/["']\s*(SELECT|INSERT|UPDATE|DELETE)\b/i.test(line) && /\.format\s*\(/.test(line)) return "python .format() SQL";
      if (/["']\s*(SELECT|INSERT|UPDATE|DELETE)\b[^"']*%s/.test(line) && /%\s*\(/.test(line)) return "python %-formatted SQL";
      return null;
    },
  },
  {
    id: "insecure-hash",
    severity: "error",
    message: "MD5/SHA-1 in a security context — broken for passwords and security hashing (C1). Use argon2id/bcrypt/scrypt.",
    test(line) {
      const hash = /\b(md5|sha1)\s*\(/i.exec(line);
      if (!hash) return null;
      if (/\w*(password|secret|digest|credential|token|signing)\w*/i.test(line)) return hash[0].replace(/\s*\(.*/, "(");
      return null;
    },
  },
  {
    id: "weak-jwt",
    severity: "error",
    message: "Weak JWT configuration — `alg: none` or a hardcoded secret (A3). Pin the algorithm and use managed keys.",
    test(line) {
      if (/algorithm\s*:\s*["']none["']|alg\s*:\s*["']none["']/i.test(line)) return 'alg: "none"';
      const m = /(jwt\.sign\([^,]*,\s*["'][A-Za-z0-9_\-]{8,}["'])/i.exec(line);
      if (!m) {
        const m2 = /((?:jsonwebtoken\.)?sign\([^,]*,\s*["'][A-Za-z0-9_\-]{8,}["'])/i.exec(line);
        if (m2 && !/^jwt\.sign/.test(m2[1])) return "hardcoded JWT secret";
      }
      if (m) return "hardcoded JWT secret";
      return null;
    },
  },
  {
    id: "code-injection",
    severity: "error",
    message: "Dynamic code execution — eval/Function/document.write with input (I3). Never evaluate input; JSON.parse for data.",
    test(line) {
      const m = /\beval\s*\(|\bnew\s+Function\s*\(|document\.write\s*\(|setTimeout\s*\(\s*["']/i.exec(line);
      if (!m) return null;
      // setTimeout with a string payload is always string-eval — flag unconditionally
      if (/setTimeout\s*\(\s*["']/i.test(m[0])) return "setTimeout(string)";
      if (/[{}$]/.test(line) || /\+/.test(line)) return m[0].trim().replace(/\s*\(.*/, "(");
      return null;
    },
  },
  {
    id: "xss-dangerous",
    severity: "error",
    message: "Unescaped data into HTML — XSS (I2). Text nodes, proper escaping, or a vetted sanitizer + CSP.",
    test(line) {
      if (/dangerouslySetInnerHTML/.test(line)) return "dangerouslySetInnerHTML";
      const m = /\.innerHTML\s*=\s*(.*)$/.exec(line);
      if (m) {
        const rhs = m[1].trim();
        const isLiteral = /^["'][^"']*["'];?$/.test(rhs) || /^`[^${]*`;?$/.test(rhs);
        if (!isLiteral) return `innerHTML = ${rhs.slice(0, 40)}`;
      }
      return null;
    },
  },
  {
    id: "command-injection",
    severity: "error",
    message: "Shell command built from input — command injection (I4). Argument arrays without a shell; allowlists.",
    test(line) {
      const m = /\b(?:exec|execSync|system|popen|os\.system|subprocess\.call|child_process\.exec)\s*\(/.exec(line);
      if (!m) return null;
      if (/[{}$]/.test(line) || /\+/.test(line)) return m[0].trim().replace(/\s*\(.*/, "(");
      return null;
    },
  },
  {
    id: "math-random-token",
    severity: "error",
    message: "Math.random for a token/credential — predictable = guessable (I6). Use a CSPRNG (crypto.randomBytes / secrets).",
    test(line) {
      if (!/Math\.random\s*\(/.test(line)) return null;
      if (/\w*(token|password|secret|otp|session|uuid|crypto)\w*/i.test(line)) return "Math.random() for security";
      return null;
    },
  },
  {
    id: "insecure-transport",
    severity: "warning",
    message: "Plain http:// URL — everything is visible to the network (C5). TLS everywhere.",
    test(line) {
      const m = /https?:\/\/([^\/"'\s]+)/i.exec(line);
      if (!m || !/^http:\/\//i.test(m[0])) return null;
      const host = m[1].replace(/:\S*$/, "").toLowerCase();
      if (["localhost", "127.0.0.1", "0.0.0.0", "example.com", "www.example.com", "example.org", "example.net"].includes(host)) return null;
      return m[0];
    },
  },
  {
    id: "permissive-cors",
    severity: "warning",
    message: "Permissive CORS — `*` with credentials, or `*` on an authenticated API, lets any origin read authenticated responses (K2).",
    test(line) {
      if (/Access-Control-Allow-Origin\s*:\s*\*/i.test(line)) return "Access-Control-Allow-Origin: *";
      if (/origin\s*:\s*["']\*["']/i.test(line)) return 'origin: "*"';
      return null;
    },
  },
  {
    id: "auth-disabled",
    severity: "warning",
    message: "Auth disabled on a route — 'for now' ships (A2). Secure first; a bypass is an explicit, reviewed, logged exception.",
    test(line) {
      const m = /\b(AllowAnonymous|permitAll|no_auth|@Public|authenticate\(false\)|isAuthenticated\(\)\s*:\s*false)\b/i.exec(line);
      if (!m) return null;
      // allow a reason comment
      if (/\b(?:review|reviewed|ticket|issue|#\d+|approved)\b/i.test(line)) return null;
      return m[1];
    },
  },
  {
    id: "insecure-cookie",
    severity: "warning",
    message: "Insecure cookie flags — session theft via MITM or XSS (A5). secure + httpOnly + SameSite on every auth cookie.",
    test(line) {
      const m = /\b(httpOnly|secure|httponly|samesite)\s*[:=]\s*(?:false|none)\b/i.exec(line);
      if (m) return `${m[1]}: ${/false/i.test(m[0]) ? "false" : "none"}`;
      return null;
    },
  },
  {
    id: "stack-trace-response",
    severity: "warning",
    message: "Stack trace in a response — recon gold for attackers (K3). Log server-side; return the minimum.",
    test(line) {
      const hasStack = /\b(err|error|e|exception)\.(stack|stacktrace)\b|\bstacktrace\b|\bSQLSTATE\b/i.test(line);
      if (!hasStack) return null;
      const inResponse = /(res\.(?:send|json|end|write)|jsonify\(|ctx\.body|writeHead|sendResponse|\.json\(\{)/i.test(line);
      return inResponse ? "internals in response body" : null;
    },
  },
];

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
    else if (st.isFile() && (EXTS.has(extname(name).toLowerCase()) || basename(name) === ".env")) acc.push(p);
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
      console.error(`seccraft: cannot read ${p}`);
      process.exit(2);
    }
    if (st.isDirectory()) walk(abs, files);
    else if (EXTS.has(extname(abs).toLowerCase()) || basename(abs) === ".env") files.push(abs);
  }
  return [...new Set(files)];
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

function scan(file) {
  const findings = [];
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return findings;
  }
  const rawLines = text.split("\n");
  // Stateful comment stripping: comments are prose, not evidence. Line rules
  // read the stripped lines; URL double-slashes are never comment starts.
  const lines = [];
  {
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
          break;
        } else if (/\.(py|yaml|yml)$/i.test(file) && line.startsWith("#", i)) {
          break;
        } else if (/\.(html?|vue|svelte)$/i.test(file) && line.startsWith("<!--", i)) {
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
  }

  lines.forEach((raw, i) => {
    for (const rule of rules) {
      let detail = rule.test(raw);
      if (!detail && rule.testFallback) detail = rule.testFallback(raw);
      if (!detail && rule.testFallback2) detail = rule.testFallback2(raw);
      if (detail) {
        findings.push({ file: basename(file), line: i + 1, rule: rule.id, severity: rule.severity, message: rule.message, detail });
      }
    }
  });

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
    console.error("seccraft: no matching source files found");
    process.exit(2);
  }

  const findings = [];
  for (const f of files) {
    for (const fnd of scan(f)) {
      findings.push({ ...fnd, path: relative(process.cwd(), f) });
    }
  }

  // Project-level: no security config found (CSP/headers/security middleware config)
  const hasSecConfig = files.some((f) =>
    /(helmet|security|headers|csp|seccraft|hardening|secure)/i.test(basename(f))
  );
  const isProjectScope = targets.some((p) => { try { return statSync(resolve(p)).isDirectory(); } catch { return false; } }) || files.length > 1;
  if (!hasSecConfig && isProjectScope) {
    findings.push({
      file: "(project)", line: 0, rule: "no-security-config", severity: "warning",
      message: "No security configuration found (CSP/headers/CORS policy module) — the free defenses nobody enabled (K4).",
      detail: "see /seccraft lock for the standard header set",
      path: ".",
    });
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const failed = errors.length + (strict ? warnings.length : 0);

  if (json) {
    console.log(JSON.stringify({ files: files.length, errors, warnings, failed }, null, 2));
  } else {
    const sev = (s) => (s === "error" ? "\x1b[31mERROR\x1b[0m" : "\x1b[33mWARN \x1b[0m");
    for (const f of findings) {
      console.log(`${sev(f.severity)} ${f.rule.padEnd(22)} ${f.path}:${f.line}  ${f.message}`);
      if (f.detail && !f.message.includes(f.detail)) console.log(`        · ${f.detail}`);
    }
    console.log(
      `\nseccraft: ${files.length} file(s) scanned · ${errors.length} error(s), ${warnings.length} warning(s)` +
        (strict ? " (--strict: warnings fail)" : "") +
        (failed ? " · FAILED" : warnings.length ? " · warnings only (run with --strict to fail)" : " · clean ✓")
    );
  }
  process.exit(failed ? 1 : 0);
}

main();
