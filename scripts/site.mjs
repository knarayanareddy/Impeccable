#!/usr/bin/env node
/**
 * Site — zero-dependency static server for the docs site (the P0-6 website).
 *
 * Serves docs/ at / with correct content types and index resolution.
 * Binds 0.0.0.0 so previews/tunnels work; a port collision exits 2 with a
 * clear message (the daemon-family convention).
 *
 * Usage:
 *   node scripts/site.mjs [--port 8787]
 */

import { createServer } from "node:http";
import { readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, extname, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DOCS = join(ROOT, "docs");

const argv = process.argv.slice(2);
const get = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const portArg = get("--port");
const port = portArg !== null && Number.isFinite(parseInt(portArg, 10)) && parseInt(portArg, 10) > 0 && parseInt(portArg, 10) < 65536 ? parseInt(portArg, 10) : 8787;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".md": "text/plain; charset=utf-8",
  ".yml": "text/plain; charset=utf-8",
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith("/")) path += "index.html";
  const abs = resolve(DOCS, normalize(path).replace(/^([/\\])+/, ""));
  if (!abs.startsWith(DOCS)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found — " + url.pathname);
    return;
  }
  res.writeHead(200, {
    "content-type": TYPES[extname(abs).toLowerCase()] || "application/octet-stream",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "cache-control": "no-store",
  });
  res.end(readFileSync(abs));
});

server.on("error", (e) => {
  console.error(`site: cannot bind port ${port} — ${e.message} (is another server running?)`);
  process.exit(2);
});
server.listen(port, "0.0.0.0", () => {
  console.log(`site: serving docs/ at http://localhost:${port} (Ctrl-C to stop)`);
});
