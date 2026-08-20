#!/usr/bin/env node
/**
 * Seccraft behavioral evals — scenario harness.
 *
 * Pins checker behaviors (rules, severities, exemptions, redaction, comment
 * stripping, project-scope), the lock-check gate, and the threat-review
 * daemon protocol. Zero dependencies.
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
const LOCK = join(here, "..", "scripts", "lock-check.mjs");
const REVIEW = join(here, "..", "scripts", "threat-review.mjs");
const TMP = join(here, ".tmp-fixtures");
let pass = 0, fail = 0;

const scenarios = [];
function scenario(name, { files, args = [], exitCode, contains = [], notContains = [], json = false }) {
  scenarios.push({ name, files, args, exitCode, contains, notContains, json });
}
const FIX = (name, content) => [name, content];

// ---- checker: secrets ----
scenario("hardcoded credential flagged and redacted (error)", {
  files: [FIX("t.js", `const apiKey = "sk-live-9f8e7d6c5b4a3210";`)],
  exitCode: 1, contains: ["hardcoded-credential", "<redacted>"], notContains: ["sk-live-9f8e7d6c5b4a3210"],
});
scenario("env fallback credential flagged (error)", {
  files: [FIX("t.js", `const apiKey = process.env.API_KEY || "sk-live-9f8e7d6c5b4a";`)],
  exitCode: 1, contains: ["hardcoded-credential"],
});
scenario(".env comment lines are not credentials", {
  files: [FIX(".env", `# API_KEY=sk-live-9f8e7d6c5b4a3210 is the old value — rotated\n# docs only\n`)],
  exitCode: 0, notContains: ["hardcoded-credential"],
});
scenario("placeholder values exempt", {
  files: [FIX("t.js", `const key = "changeme";\nconst pw = "password";`)],
  exitCode: 0, notContains: ["hardcoded-credential"],
});
scenario("dotenv unquoted credentials flagged (error)", {
  files: [FIX(".env", `API_KEY=sk-live-9f8e7d6c5b4a3210\n`)],
  exitCode: 1, contains: ["hardcoded-credential", "<redacted>"],
});

// ---- checker: injection ----
scenario("python format/percent SQL flagged (error)", {
  files: [FIX("t.py", `q = "SELECT * FROM t WHERE id = {}".format(x)\nq2 = "SELECT * FROM t WHERE id = %s" % (user,)`)],
  exitCode: 1, contains: ["interpolated-sql"],
});
scenario("bound parameters clean", {
  files: [FIX("t.js", `db.query("SELECT id FROM t WHERE id = ?", [x]);`)],
  exitCode: 0, notContains: ["interpolated-sql"],
});
scenario("xss sinks flagged (error)", {
  files: [FIX("t.js", `el.innerHTML = html;\n<div dangerouslySetInnerHTML={{ __html: html }} />;`)],
  exitCode: 1, contains: ["xss-dangerous"],
});
scenario("code injection flagged (error) incl. setTimeout(string)", {
  files: [FIX("t.js", `eval(code);\nsetTimeout("doThing()", 100);`)],
  exitCode: 1, contains: ["code-injection"],
});
scenario("command injection flagged (error)", {
  files: [FIX("t.js", `exec("rm -rf " + file);`)],
  exitCode: 1, contains: ["command-injection"],
});

// ---- checker: crypto & tokens ----
scenario("weak jwt flagged (error) incl. jsonwebtoken/destructured", {
  files: [FIX("t.js", `const a = jwt.sign(p, "hardcoded-secret-key");\nconst b = jsonwebtoken.sign(p, "another-secret-key");\nconst c = sign(p, "third-secret-key");`)],
  exitCode: 1, contains: ["weak-jwt"],
});
scenario("alg none flagged (error)", {
  files: [FIX("t.yaml", `algorithm: "none"`)],
  exitCode: 1, contains: ["weak-jwt"],
});
scenario("math.random for tokens flagged (error)", {
  files: [FIX("t.js", `function newToken() { return Math.random().toString(36); }`)],
  exitCode: 1, contains: ["math-random-token"],
});
scenario("md5-for-passwords flagged; checksum context clean", {
  files: [FIX("t.js", `function hashPassword(pw) { return md5(pw); }\nfunction checksum(buf) { return md5(buf); }`)],
  exitCode: 1, contains: ["insecure-hash"],
});

// ---- checker: config & transport ----
scenario("permissive cors flagged", {
  files: [FIX("t.yaml", `cors:\n  origin: "*"`)],
  exitCode: 0, contains: ["permissive-cors"],
});
scenario("insecure cookie flags flagged", {
  files: [FIX("t.js", `res.cookie("session", t, { secure: false, httpOnly: false });`)],
  exitCode: 0, contains: ["insecure-cookie"],
});
scenario("plain http flagged; localhost exempt", {
  files: [FIX("t.js", `const api = "http://api.example.com/v1";\nconst dev = "http://localhost:3000";`)],
  exitCode: 0, contains: ["insecure-transport"],
});

// ---- checker: comment stripping + scope ----
scenario("prose comments are not evidence", {
  files: [FIX("t.js", `// prose: we once used eval() and md5() for passwords here\nconst x = 1;`)],
  exitCode: 0, notContains: ["code-injection", "insecure-hash"],
});
scenario("no-security-config: project scope only (single file exempt)", {
  files: [FIX("t.js", `const x = 1;`)],
  exitCode: 0, notContains: ["no-security-config"],
});

// ---- checker: clean pass ----
scenario("hardened file passes clean", {
  files: [FIX("t.ts", `import crypto from "node:crypto";\nimport argon2 from "argon2";\nexport function issueToken() { return crypto.randomBytes(32).toString("hex"); }\nexport async function hash(pw: string) { return argon2.hash(pw, { type: argon2.argon2id }); }\nexport async function findUser(email: string) { return db.query("SELECT id, email FROM users WHERE email = ?", [email]); }`)],
  exitCode: 0,
});

// ---- lock-check scenarios ----
async function lockScenario(name, config, { exitCode, contains = [], notContains = [] }) {
  const dir = TMP + "-lc-" + name.replace(/[^a-z0-9]/gi, "");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "c.json"), JSON.stringify(config));
  try {
    try {
      const out = execFileSync("node", [LOCK, "--config", join(dir, "c.json")], { encoding: "utf8" });
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
    rmSync(dir, { recursive: true, force: true });
  }
}

await lockScenario("lock-check: unmapped config reports no-areas exclusively", {},
  { exitCode: 1, contains: ["no-areas-mapped"], notContains: ["missing csp", "auth cookies"] });

await lockScenario("lock-check: gap-ridden config fails with the checklist", {
  headers: {}, cookies: { secure: false }, cors: { origin: "*", credentials: true }, debug: true,
}, { exitCode: 1, contains: ["missing csp", "auth cookies must be Secure", 'origin "*"', "debug mode on"] });

await lockScenario("lock-check: locked config passes", {
  headers: { csp: "default-src 'self'", hsts: "max-age=31536000", xContentTypeOptions: "nosniff", frameOptions: "DENY" },
  cookies: { secure: true, httpOnly: true, sameSite: "lax" },
  cors: { origin: ["https://app.example.com"] },
  tls: { minVersion: "1.3", redirectHttp: true },
  debug: false,
}, { exitCode: 0, notContains: ["GAP"] });

// ---- threat-review daemon protocol ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await (async () => {
  const dir = TMP + "-tr";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "threats.json"), JSON.stringify([
    { boundary: "HTTP ingress", threat: "Tampering: order payload spoofed", stride: "T", likelihood: "high", impact: "high", control: "schema validation" },
    { boundary: "payment-api", threat: "Spoofing: forged webhook", stride: "S", likelihood: "med", impact: "high" },
  ]));
  const port = 8800 + (process.pid % 800); // unique per run — stale daemons must not poison this one
  const srv = spawn("node", [REVIEW, "--threats", "threats.json", "--round", "r1", "--port", String(port)], { cwd: dir });
  try {
    let up = false;
    for (let i = 0; i < 20; i++) {
      try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
      await wait(150);
    }
    if (!up) { console.log("✗ threat-review: did not come up"); fail++; }
    else {
      const page = await (await fetch(`http://localhost:${port}/`)).text();
      if (!page.includes("Tampering: order payload spoofed") || !page.includes("no control stated")) { console.log("✗ threat-review: threats/gap-callout missing"); fail++; }
      else {
        console.log("✓ threat-review: serves threats and calls out the control gap"); pass++;
        const partial = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "Tampering: order payload spoofed": "accept" } }) });
        if (partial.status !== 400) { console.log("✗ threat-review: partial submit not rejected"); fail++; }
        else {
          console.log("✓ threat-review: partial submit rejected"); pass++;
          const full = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "Tampering: order payload spoofed": "accept", "Spoofing: forged webhook": "mitigate" } }) });
          if (full.status !== 200) { console.log("✗ threat-review: full submit rejected"); fail++; }
          else {
            const out = execFileSync("node", [REVIEW, "--round", "r1", "--result"], { cwd: dir, encoding: "utf8" });
            if (!out.includes('"verdict": "mitigate"') || !out.includes('"verdict": "accept"')) { console.log("✗ threat-review: result missing verdicts"); fail++; }
            else { console.log("✓ threat-review: verdicts recorded and readable"); pass++; }
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
console.log(`\nseccraft scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
