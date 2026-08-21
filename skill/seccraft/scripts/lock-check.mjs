#!/usr/bin/env node
/**
 * Seccraft lock-check — the lock command's checklist as a mechanical gate.
 *
 * Applies the standard secure-defaults checklist (headers, cookies, CORS,
 * TLS, debug) to a config file (helmet/express-style, nginx-style, or a
 * generic key:value config) and reports every missing default. The gate
 * blocks on gaps; the lock command's doctrine in tool form.
 *
 * Usage:
 *   node lock-check.mjs --config config.json [--json]
 *
 * Config shape (generic key:value — adapters for framework configs follow):
 *   {
 *     "headers": { "csp": "…", "hsts": "…", "xContentTypeOptions": "nosniff",
 *                  "frameOptions": "DENY", "referrerPolicy": "…" },
 *     "cookies": { "secure": true, "httpOnly": true, "sameSite": "lax" },
 *     "cors": { "origin": ["https://app.example.com"] },
 *     "tls": { "minVersion": "1.2", "redirectHttp": true },
 *     "debug": false
 *   }
 *
 * Exit codes: 0 all defaults present · 1 gaps found · 2 usage error
 */

import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const configFile = get("--config");
const json = argv.includes("--json");

if (!configFile) {
  console.error("lock-check: usage: node lock-check.mjs --config <config.json> [--json]");
  process.exit(2);
}

let config;
try {
  config = JSON.parse(readFileSync(configFile, "utf8"));
} catch (e) {
  console.error(`lock-check: cannot read config ${configFile}: ${e.message}`);
  process.exit(2);
}

const gaps = [];
let noAreas = false;

// The honest gate: if no area is mapped at all, the adapter may be the gap —
// and the per-area checks are noise against an unmapped config.
if (!config.headers && !config.cookies && !config.cors && !config.tls) {
  noAreas = true;
  gaps.push({ area: "config", rule: "no-areas-mapped", message: "config maps no areas (headers/cookies/cors/tls all absent) — is the adapter wired, or is the surface unconfigured?" });
}

if (noAreas) {
  // skip the area checks — the no-areas gap is the finding
} else {
checkAreas();
}
function checkAreas() {
// ---- headers (the standard set — lock.md) ----
const headers = config.headers || {};
for (const h of ["csp", "hsts"]) {
  if (!headers[h]) gaps.push({ area: "headers", rule: h, message: `missing ${h} — the free defense nobody enabled (lock.md)` });
}
if (!headers.xContentTypeOptions) gaps.push({ area: "headers", rule: "x-content-type-options", message: "missing X-Content-Type-Options: nosniff" });
if (!headers.frameOptions && !headers.csp) gaps.push({ area: "headers", rule: "frame-ancestors", message: "missing frame protection (frame-ancestors/X-Frame-Options)" });

// ---- cookies (auth cookies must be locked) ----
const cookies = config.cookies || {};
if (cookies.secure !== true) gaps.push({ area: "cookies", rule: "secure", message: "auth cookies must be Secure (anti-patterns.md A5)" });
if (cookies.httpOnly !== true) gaps.push({ area: "cookies", rule: "httpOnly", message: "auth cookies must be HttpOnly" });
if (!cookies.sameSite) gaps.push({ area: "cookies", rule: "sameSite", message: "auth cookies need a SameSite policy (Lax or Strict)" });

// ---- CORS (allowlist, never * with credentials) ----
const cors = config.cors || {};
const origins = cors.origin;
if (origins === "*" || (Array.isArray(origins) && origins.includes("*"))) {
  gaps.push({ area: "cors", rule: "origin", message: "origin \"*\" on an authenticated API — any origin can read authenticated responses (K2)" });
} else if (!origins || (Array.isArray(origins) && !origins.length)) {
  gaps.push({ area: "cors", rule: "origin", message: "no explicit origin allowlist" });
}
if (cors.credentials === true && origins === "*") {
  gaps.push({ area: "cors", rule: "credentials", message: "credentials with wildcard origin" });
}

// ---- TLS ----
const tls = config.tls || {};
if (!tls.minVersion) gaps.push({ area: "tls", rule: "minVersion", message: "no TLS minimum stated (≥1.2, 1.3 preferred)" });
if (tls.redirectHttp === false) gaps.push({ area: "tls", rule: "redirectHttp", message: "HTTP not redirected to HTTPS" });

// ---- debug / production posture ----
if (config.debug === true) gaps.push({ area: "production", rule: "debug", message: "debug mode on in production config (K1)" });
if (config.stackTraces === true) gaps.push({ area: "production", rule: "stackTraces", message: "stack traces exposed to clients (K3)" });
}

if (json) {
  console.log(JSON.stringify({ config: configFile, gaps, gapCount: gaps.length }, null, 2));
} else {
  if (!gaps.length) {
    console.log("lock-check: all secure defaults present ✓");
  } else {
    for (const g of gaps) {
      console.log(`\x1b[31mGAP\x1b[0m ${g.area.padEnd(12)} ${g.rule.padEnd(22)} ${g.message}`);
    }
    console.log(`\nlock-check: ${gaps.length} gap(s) · FAILED — run /seccraft lock to close them`);
  }
}
process.exitCode = gaps.length ? 1 : 0;
