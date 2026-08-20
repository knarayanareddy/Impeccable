#!/usr/bin/env node
/**
 * Obscraft behavioral evals — scenario harness.
 *
 * Pins checker behaviors (rules, severities, exemptions, windowed detection,
 * comment stripping), the telemetry-check shape gate, and the slo-review
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
const TCHECK = join(here, "..", "scripts", "telemetry-check.mjs");
const REVIEW = join(here, "..", "scripts", "slo-review.mjs");
const TMP = join(here, ".tmp-fixtures");
let pass = 0, fail = 0;

const scenarios = [];
function scenario(name, { files, args = [], exitCode, contains = [], notContains = [], json = false }) {
  scenarios.push({ name, files, args, exitCode, contains, notContains, json });
}
const FIX = (name, content) => [name, content];

// ---- checker: log rules ----
scenario("secret in log flagged (error) incl. bare token", {
  files: [FIX("t.js", `logger.info("charging", { token: "tok_123", order });`)],
  exitCode: 1, contains: ["secret-in-log"],
});
scenario("pii in log flagged; redaction exempt", {
  files: [FIX("t.js", `logger.info("user", { email });\nlogger.info("user", { email: redact(email) });`)],
  exitCode: 0, contains: ["pii-in-log"],
});
scenario("generic error flagged", {
  files: [FIX("t.js", `log.error("Something went wrong");`)],
  exitCode: 0, contains: ["generic-error"],
});
scenario("string-concat log flagged; structured clean", {
  files: [FIX("t.js", `console.log("Processing " + user.email);\nlogger.info("processing", { email: user.email });`)],
  exitCode: 0, contains: ["string-concat-log"],
});
scenario("log-in-loop flagged with lookback; aggregate clean", {
  files: [FIX("t.js", `for (const item of items) {\n  const a = validate(item);\n  logger.info("item", { a });\n}\nlogger.info("batch", { count: items.length });`)],
  exitCode: 0, contains: ["log-in-loop"],
});
scenario("mean-only metric flagged; percentiles clean", {
  files: [FIX("t.js", `const m = metrics.mean("checkout_latency_seconds");\nconst h = metrics.observe("checkout_latency_seconds", v, { p95: v });`)],
  exitCode: 0, contains: ["mean-only-metric"],
});
scenario("metric-name scatter at 3+ flagged", {
  files: [FIX("t.js", `metrics.inc("checkout_errors_total");\nmetrics.inc("checkout_errors_total");\nmetrics.inc("checkout_errors_total");`)],
  exitCode: 0, contains: ["metric-name-scatter"],
});
scenario("alert without owner flagged in yaml; with owner clean", {
  files: [FIX("t.yaml", `- alert: A\n  expr: rate(x[5m]) > 1\n- alert: B\n  expr: rate(y[5m]) > 1\n  owner: team\n  runbook: r.md\n`)],
  exitCode: 0, contains: ["alert-no-owner"],
});
scenario("no-correlation-propagation flagged in services; tsx exempt", {
  files: [FIX("service.ts", `const res = await fetch("https://api.internal/x");`),
         FIX("page.tsx", `const load = () => fetch("/api/orders");`)],
  exitCode: 0, contains: ["no-correlation-propagation"],
});

// ---- checker: comment stripping ----
scenario("prose comments are not evidence (avg, for-latency, token)", {
  files: [FIX("t.js", `// prose: we used avg() for latency and logged the token here — docs only\nlogger.info("ok", { orderId });`)],
  exitCode: 0, notContains: ["mean-only-metric", "log-in-loop", "secret-in-log"],
});

// ---- checker: clean pass ----
scenario("idiomatic telemetry passes clean", {
  files: [FIX("t.ts", `import { trace } from "@opentelemetry/api";\nconst tracer = trace.getTracer("checkout");\nexport const CHECKOUT_LATENCY = "checkout_latency_seconds";\nexport async function checkout(orderId: string) {\n  const span = tracer.startSpan("checkout.complete", { attributes: { order_id: orderId } });\n  try {\n    const res = await fetch("https://payments.internal/charge", { headers: { traceparent: span.spanContext().traceId } });\n    metrics.observe(CHECKOUT_LATENCY, res.duration, { status: "ok" });\n    logger.info("checkout.completed", { orderId, traceId: span.spanContext().traceId });\n    return res;\n  } catch (err) {\n    logger.error("checkout.failed", { orderId, error: err.code, traceId: span.spanContext().traceId });\n    throw err;\n  }\n}`),
         FIX("slo.yaml", `slo:\n  name: checkout-availability\n  sli: checkout.complete < 3s\n  target: 99.9\n  window: 30d\n  owner: payments-team\n`)],
  exitCode: 0,
});

// ---- telemetry-check scenarios ----
async function tcheckScenario(name, files, args, { exitCode, contains = [], notContains = [] }) {
  const dir = TMP + "-tc-" + name.replace(/[^a-z0-9]/gi, "");
  mkdirSync(dir, { recursive: true });
  for (const [fname, content] of Object.entries(files)) writeFileSync(join(dir, fname), content);
  const fullArgs = [];
  for (const [flag, fname] of args) fullArgs.push(flag, join(dir, fname));
  try {
    try {
      const out = execFileSync("node", [TCHECK, ...fullArgs], { encoding: "utf8" });
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

const SLO_GOOD = `slo:\n  name: checkout-availability\n  sli: checkout.complete < 3s\n  target: 99.9\n  window: 30d\n  owner: payments-team\n`;
const ALERT_GOOD = `alerts:\n  - name: CheckoutFastBurn\n    expr: slo_burn_rate(checkout, 1h) > 2\n    owner: payments-team\n    runbook: runbooks/checkout-burn.md\n`;
const METRIC_GOOD = `[{"name":"checkout_latency_seconds","type":"histogram","question":"is checkout fast at p95?"}]`;

await tcheckScenario("telemetry-check: valid shapes pass", { "slo.yaml": SLO_GOOD, "alerts.yaml": ALERT_GOOD, "metrics.json": METRIC_GOOD },
  [["--slos", "slo.yaml"], ["--alerts", "alerts.yaml"], ["--metrics", "metrics.json"]], { exitCode: 0, notContains: ["GAP"] });

await tcheckScenario("telemetry-check: missing quartet members flagged", {
  "slo.yaml": `slo:\n  name: checkout-availability\n  sli: checkout.complete < 3s\n  target: 99.9\n`,
  "alerts.yaml": `alerts:\n  - name: A\n    expr: x\n`,
}, [["--slos", "slo.yaml"], ["--alerts", "alerts.yaml"]], {
  exitCode: 1, contains: ["missing-window", "missing-owner", "missing-runbook"],
});

await tcheckScenario("telemetry-check: 100% target flagged", { "slo.yaml": `slo:\n  name: x\n  sli: y\n  target: 100\n  window: 30d\n  owner: t\n` },
  [["--slos", "slo.yaml"]], { exitCode: 1, contains: ["impossible-target"] });

await tcheckScenario("telemetry-check: empty file refuses (no silent valid)", { "slo.yaml": `` },
  [["--slos", "slo.yaml"]], { exitCode: 2, contains: ["zero SLOs"] });

await tcheckScenario("telemetry-check: metric without question flagged", { "metrics.json": `[{"name":"m","type":"counter"}]` },
  [["--metrics", "metrics.json"]], { exitCode: 1, contains: ["missing-question"] });

await tcheckScenario("telemetry-check: unknown metric type flagged", { "metrics.json": `[{"name":"m","type":"guage","question":"q"}]` },
  [["--metrics", "metrics.json"]], { exitCode: 1, contains: ["unknown-type"] });

// ---- slo-review daemon protocol ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await (async () => {
  const dir = TMP + "-sr";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "review.json"), JSON.stringify([
    { kind: "slo", name: "checkout-availability", facts: "99.9% complete < 3s over 30d", owner: "payments-team" },
    { kind: "alert", name: "CheckoutFastBurn", facts: "burn rate 2%/1h", owner: "payments-team", runbook: "runbooks/checkout-burn.md" },
    { kind: "alert", name: "OrphanedPage", facts: "cpu > 80%" },
  ]));
  // Unique per run — a stale daemon from a prior run must not poison this one
  const port = 8900 + (process.pid % 900);
  const srv = spawn("node", [REVIEW, "--review", "review.json", "--round", "r1", "--port", String(port)], { cwd: dir });
  try {
    let up = false;
    for (let i = 0; i < 20; i++) {
      try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
      await wait(150);
    }
    if (!up) { console.log("✗ slo-review: did not come up"); fail++; }
    else {
      const page = await (await fetch(`http://localhost:${port}/`)).text();
      if (!page.includes("checkout-availability") || !page.includes("gap: no owner, no runbook")) { console.log("✗ slo-review: entries/gap-callout missing"); fail++; }
      else {
        console.log("✓ slo-review: serves entries and calls out the gaps"); pass++;
        const partial = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "checkout-availability": "approve" } }) });
        if (partial.status !== 400) { console.log("✗ slo-review: partial submit not rejected"); fail++; }
        else {
          console.log("✓ slo-review: partial submit rejected"); pass++;
          const full = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "checkout-availability": "approve", "CheckoutFastBurn": "approve", "OrphanedPage": "flag" } }) });
          if (full.status !== 200) { console.log("✗ slo-review: full submit rejected"); fail++; }
          else {
            const out = execFileSync("node", [REVIEW, "--round", "r1", "--result"], { cwd: dir, encoding: "utf8" });
            if (!out.includes('"verdict": "flag"') || !out.includes('"verdict": "approve"')) { console.log("✗ slo-review: result missing verdicts"); fail++; }
            else { console.log("✓ slo-review: verdicts recorded and readable"); pass++; }
          }
        }
      }
    }
  } finally {
    srv.kill();
    rmSync(dir, { recursive: true, force: true });
  }
})();

// ---- daemon port-collision behavior (the EADDRINUSE fix) ----
await (async () => {
  const dir = TMP + "-coll";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "review.json"), JSON.stringify([{ kind: "slo", name: "a", facts: "f", owner: "t" }]));
  const port = 8993;
  const srv1 = spawn("node", [REVIEW, "--review", "review.json", "--round", "c1", "--port", String(port)], { cwd: dir });
  try {
    let up = false;
    for (let i = 0; i < 20; i++) {
      try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
      await wait(150);
    }
    if (!up) { console.log("✗ daemon port-collision: first daemon did not come up"); fail++; }
    else {
      const srv2 = spawn("node", [REVIEW, "--review", "review.json", "--round", "c2", "--port", String(port)], { cwd: dir });
      try {
        await wait(800);
        if (srv2.exitCode !== 2) { console.log(`✗ daemon port-collision: second daemon should exit 2, got ${srv2.exitCode}`); fail++; }
        else { console.log("✓ daemon port-collision: clean exit 2 instead of an unhandled crash"); pass++; }
      } finally {
        srv2.kill();
      }
    }
  } finally {
    srv1.kill();
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
console.log(`\nobscraft scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
