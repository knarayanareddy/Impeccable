#!/usr/bin/env node
/**
 * Codecraft hook manager.
 *
 * Wires the deterministic checker into the harness's automation hooks —
 * the code-facet equivalent of the reference skill's hooks subcommand.
 * Default is a dry run; --apply writes.
 *
 * Usage:
 *   node hooks.mjs status              is the hook wired in this project?
 *   node hooks.mjs on [--apply]        print (or write) the Claude Code settings merge
 *   node hooks.mjs off [--apply]       print (or remove) the hook entry
 *
 * Exit codes: 0 ok/wired · 1 not wired (status) · 2 usage error
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CHECKER = join(here, "check.mjs");
const SETTINGS = join(process.cwd(), ".claude", "settings.json");

const mode = process.argv[2];
const apply = process.argv.includes("--apply");

function readSettings({ strict = false } = {}) {
  if (!existsSync(SETTINGS)) return {};
  try {
    return JSON.parse(readFileSync(SETTINGS, "utf8"));
  } catch {
    if (strict) {
      console.error(`hooks: ${SETTINGS} exists but is not valid JSON — refusing to overwrite. Fix it by hand, then re-run.`);
      process.exit(2);
    }
    return {};
  }
}

function hookEntry() {
  return {
    matcher: "Edit|Write",
    hooks: [
      {
        type: "command",
        // || true is deliberate: the hook surfaces findings; the agent's verification
        // loop fixes them. Blocking belongs to CI gates, not advisory hooks.
        command: `node "${CHECKER}" --strict --target <path> || true`,
      },
    ],
  };
}

function wired(settings) {
  const list = (settings.hooks && settings.hooks.PostToolUse) || [];
  return list.some((e) => JSON.stringify(e).includes("codecraft"));
}

function applyOn(settings) {
  const next = JSON.parse(JSON.stringify(settings));
  next.hooks = next.hooks || {};
  const list = (next.hooks.PostToolUse || []).filter(
    (e) => !JSON.stringify(e).includes("codecraft")
  );
  list.push(hookEntry());
  next.hooks.PostToolUse = list;
  return next;
}

function applyOff(settings) {
  const next = JSON.parse(JSON.stringify(settings));
  if (next.hooks) {
    const list = (next.hooks.PostToolUse || []).filter(
      (e) => !JSON.stringify(e).includes("codecraft")
    );
    if (list.length) next.hooks.PostToolUse = list;
    else delete next.hooks.PostToolUse;
  }
  return next;
}

function write(settings) {
  mkdirSync(dirname(SETTINGS), { recursive: true });
  writeFileSync(SETTINGS, JSON.stringify(settings, null, 2) + "\n");
}

if (mode === "status") {
  const s = readSettings();
  if (wired(s)) {
    console.log("codecraft hook: wired (.claude/settings.json → PostToolUse)");
    process.exit(0);
  }
  console.log("codecraft hook: not wired");
  process.exit(1);
}

if (mode === "on") {
  const next = applyOn(readSettings({ strict: apply }));
  if (apply) {
    write(next);
    console.log("codecraft hook: enabled in .claude/settings.json (PostToolUse → Edit|Write)");
  } else {
    console.log("Dry run — merge this into .claude/settings.json (or re-run with --apply):");
    console.log(JSON.stringify(next, null, 2));
  }
  process.exit(0);
}

if (mode === "off") {
  const next = applyOff(readSettings({ strict: apply }));
  if (apply) {
    write(next);
    console.log("codecraft hook: removed from .claude/settings.json");
  } else {
    console.log("Dry run — the codecraft PostToolUse entry will be removed (re-run with --apply):");
    console.log(JSON.stringify(next, null, 2));
  }
  process.exit(0);
}

console.error("hooks: usage: node hooks.mjs <status|on|off> [--apply]");
process.exit(2);
