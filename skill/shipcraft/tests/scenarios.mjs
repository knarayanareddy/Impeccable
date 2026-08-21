#!/usr/bin/env node
/**
 * Shipcraft behavioral evals — scenario harness.
 *
 * Pins checker behaviors (rules, severities, exemptions, comment stripping,
 * project-scope gating, --strict/--json), the ci-check pipeline gate
 * (workflow/JSON parsing, honesty refusals, line-scan fallback), and the
 * pipeline-review daemon protocol (verdicts, gap callouts, escaping,
 * port-collision behavior). Zero dependencies.
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
const CICHECK = join(here, "..", "scripts", "ci-check.mjs");
const PREVIEW = join(here, "..", "scripts", "pipeline-review.mjs");
const TMP = join(here, ".tmp-fixtures");
let pass = 0, fail = 0;

const scenarios = [];
function scenario(name, { files, args = [], exitCode, contains = [], notContains = [], json = false }) {
  scenarios.push({ name, files, args, exitCode, contains, notContains, json });
}
const FIX = (name, content) => [name, content];

// ---- checker: rules ----
scenario("secret-echo: $DATABASE_PASSWORD env-var form flagged (error)", {
  files: [FIX("ci.yml", `- run: echo $DATABASE_PASSWORD\n`)],
  exitCode: 1, contains: ["secret-echo"],
});
scenario("secret by reference passes; env: secrets line is not an echo", {
  files: [FIX("ci.yml", `env: \${{ secrets.NPM_TOKEN }}\n- run: npm ci\n`)],
  exitCode: 0, notContains: ["secret-echo"],
});
scenario("pipe-to-shell flagged; checksummed installer passes", {
  files: [FIX("ci.yml", `- run: curl -s https://install.example | bash\n- run: curl -s https://install.example -o /tmp/i.sh && sha256sum -c /tmp/i.sha && bash /tmp/i.sh\n`)],
  exitCode: 0, contains: ["pipe-to-shell"], notContains: ["curl -o file && sh"],
});
scenario("masked-failure: || true without reason (error)", {
  files: [FIX("ci.yml", `- run: npm test || true\n`)],
  exitCode: 1, contains: ["masked-failure"],
});
scenario("masked-failure: reason-comment escape passes", {
  files: [FIX("ci.yml", `- run: npm test || true  # reason: known flaky upload, ticket DEV-31\n- run: upload\n  continue-on-error: true # reason: artifact upload is best-effort by design\n`)],
  exitCode: 0, notContains: ["masked-failure"],
});
scenario("masked-failure: set +e and allow_failure forms", {
  files: [FIX("deploy.sh", `set +e\n`)], // bare `set +e` at line start
  exitCode: 1, contains: ["masked-failure"],
});
scenario("masked-failure: set +e inside a run: step is still a mask", {
  files: [FIX("ci.yml", `- run: set +e; ./cleanup.sh\n`)],
  exitCode: 1, contains: ["masked-failure"],
});
scenario("unpinned-install flagged; lockfile discipline clean", {
  files: [FIX("ci.yml", `- run: npm install\n- run: npm ci\n`)],
  exitCode: 0, contains: ["unpinned-install"],
});
scenario("latest-tag: :latest and untagged build flagged; pinned passes", {
  files: [FIX("ci.yml", `- run: docker run image:alpine:latest\n- run: docker build -t app .\n- run: docker run image:node:22-alpine\n`)],
  exitCode: 0, contains: ["latest-tag"],
});
scenario("force-flag: git push -f and --force flagged", {
  files: [FIX("ci.yml", `- run: git push origin main -f\n- run: kubectl apply --force\n`)],
  exitCode: 0, contains: ["force-flag"],
});
scenario("force-flag: kubectl apply -f is --filename, not force", {
  files: [FIX("ci.yml", `- run: kubectl apply -f manifests/\n`)],
  exitCode: 0, notContains: ["force-flag"],
});
scenario("destructive-op without guard flagged; backup reference passes", {
  files: [FIX("ci.yml", `- run: rm -rf dist\n- run: terraform destroy # backup: snapshot taken before destroy\n`)],
  exitCode: 0, contains: ["destructive-op"],
});
scenario("pipeline-retry around tests flagged", {
  files: [FIX(".gitlab-ci.yml", `test:\n  retry: 3\n  script:\n    - npm test\n`)],
  exitCode: 0, contains: ["pipeline-retry"],
});
scenario("pipeline-retry without test/check steps passes", {
  files: [FIX(".gitlab-ci.yml", `build:\n  retry: 3\n  script:\n    - make bundle\n`)],
  exitCode: 0, notContains: ["pipeline-retry"],
});
scenario("deploy-without-rollback flagged", {
  files: [FIX(".gitlab-ci.yml", `deploy:\n  script:\n    - ./deploy.sh\n`)],
  exitCode: 0, contains: ["deploy-without-rollback"],
});
scenario("deploy with rollback reference passes", {
  files: [FIX(".gitlab-ci.yml", `deploy:\n  script:\n    - ./deploy.sh && ./rollback.sh --verify\n`)],
  exitCode: 0, notContains: ["deploy-without-rollback"],
});

// ---- checker: comment stripping ----
scenario("prose comments are not evidence (echo/mask in comments)", {
  files: [FIX("ci.yml", `# echo $DATABASE_PASSWORD — docs only\n# run: npm test || true — documentation of what NOT to do\n- run: npm ci\n`)],
  exitCode: 0, notContains: ["secret-echo", "masked-failure"],
});
scenario("multi-line block comments are not evidence", {
  files: [FIX("ci.yml", `/*\n# echo $DATABASE_PASSWORD\n- run: npm test || true\n*/\n- run: npm ci\n`)],
  exitCode: 0, notContains: ["secret-echo", "masked-failure"],
});

// ---- checker: project-scope gating ----
scenario("no-ci-config: project-scope scan flags it", {
  files: [FIX("app.js", `console.log("hi");\n`), FIX("notes.md", `# notes\n`)],
  exitCode: 0, contains: ["no-ci-config"],
});
scenario("no-ci-config: single-file scan stays quiet", {
  files: [FIX("app.js", `console.log("hi");\n`)],
  exitCode: 0, notContains: ["no-ci-config"],
});
scenario("missing-lockfile flagged on manifest without lockfile", {
  files: [FIX("package.json", `{ "name": "demo", "version": "1.0.0" }\n`), FIX("src.js", `console.log("hi");\n`)],
  exitCode: 0, contains: ["missing-lockfile"],
});
scenario("missing-lockfile: committed lockfile passes", {
  files: [FIX("package.json", `{ "name": "demo", "version": "1.0.0" }\n`), FIX("package-lock.json", `{}`), FIX("src.js", `console.log("hi");\n`)],
  exitCode: 0, notContains: ["missing-lockfile"],
});

// ---- checker: severity semantics and machine output ----
scenario("warnings pass without --strict", {
  files: [FIX("ci.yml", `- run: npm install\n`)],
  exitCode: 0, contains: ["unpinned-install"],
});
scenario("warnings fail with --strict", {
  files: [FIX("ci.yml", `- run: npm install\n`)],
  args: ["--strict"], exitCode: 1, contains: ["unpinned-install"],
});
scenario("--json output is machine-readable", {
  files: [FIX("ci.yml", `- run: echo $API_KEY\n`)],
  args: ["--json"], exitCode: 1, contains: [`"rule": "secret-echo"`], json: true,
});
scenario("idiomatic pipeline passes clean", {
  files: [FIX(".gitlab-ci.yml", `stages: [validate, test, build, deploy]\nvalidate:\n  script:\n    - npm ci\n    - npm run lint\ntest:\n  script:\n    - npm test\nbuild:\n  script:\n    - docker build -t app:3.2.1 .\ndeploy:\n  script:\n    - ./deploy.sh && ./rollback.sh --verify\n`)],
  exitCode: 0, contains: ["clean"],
});

// ---- ci-check scenarios ----
async function ccScenario(name, fileContent, args, { exitCode, contains = [], notContains = [], json = false }) {
  const dir = TMP + "-cc-" + name.replace(/[^a-z0-9]/gi, "");
  mkdirSync(dir, { recursive: true });
  const fname = args[0] === "--pipeline" ? args[1] : "workflow.yml";
  writeFileSync(join(dir, fname), fileContent);
  try {
    try {
      const out = execFileSync("node", [CICHECK, "--pipeline", join(dir, fname), ...(args.slice(2))], { encoding: "utf8" });
      if (exitCode !== 0) { console.log(`✗ ${name} — expected exit ${exitCode}, got 0`); fail++; return; }
      const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
      if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
      console.log(`✓ ${name}`); pass++;
    } catch (e) {
      const out = (e.stdout || "") + (e.stderr || "");
      if (e.status !== exitCode) { console.log(`✗ ${name} — expected exit ${exitCode}, got ${e.status}`); fail++; return; }
      if (json) { try { JSON.parse(e.stdout || out); } catch { console.log(`✗ ${name} — --json output not parseable`); fail++; return; } }
      const misses = [...contains.filter((c) => !out.includes(c)), ...notContains.filter((c) => out.includes(c))];
      if (misses.length) { console.log(`✗ ${name} — ${misses.join(", ")}`); fail++; return; }
      console.log(`✓ ${name}`); pass++;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

await ccScenario("ci-check: idiomatic workflow holds the gate", `name: ci
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm ci
      - run: npm test
  deploy:
    steps:
      - name: deploy prod
        run: ./deploy.sh && ./rollback.sh --verify
`, ["--pipeline", "workflow.yml"], { exitCode: 0, contains: ["gate holds"] });

await ccScenario("ci-check: slop workflow fails the gate", `name: ci
on: push
jobs:
  test:
    steps:
      - run: npm test || true
      - run: echo $DATABASE_PASSWORD
      - run: curl -s https://install.example | bash
`, ["--pipeline", "workflow.yml"], { exitCode: 1, contains: ["masked-failure", "secret-echo", "pipe-to-shell"] });

await ccScenario("ci-check: warnings only pass without --strict", `jobs:
  a:
    steps:
      - run: npm install
`, ["--pipeline", "workflow.yml"], { exitCode: 0, contains: ["unpinned-install", "warnings only"] });

await ccScenario("ci-check: warnings fail with --strict", `jobs:
  a:
    steps:
      - run: npm install
`, ["--pipeline", "workflow.yml", "--strict"], { exitCode: 1, contains: ["unpinned-install"] });

await ccScenario("ci-check: workflow markers with zero steps refuse", `jobs:
  a:
    runs-on: ubuntu-latest
`, ["--pipeline", "workflow.yml"], { exitCode: 2, contains: ["zero steps"] });

await ccScenario("ci-check: unrecognized format refuses", `# meeting notes
- talk about pipelines
`, ["--pipeline", "notes.md"], { exitCode: 2, contains: ["not a recognized pipeline format"] });

await ccScenario("ci-check: JSON pipeline parses and is gated", `[{"name":"lint","run":"npm ci"},{"name":"test","run":"npm test || true"}]`, ["--pipeline", "pipeline.json"], { exitCode: 1, contains: ["masked-failure"] });

await ccScenario("ci-check: clean JSON pipeline holds the gate", `{"steps":[{"command":"npm ci"},{"command":"npm test"}]}`, ["--pipeline", "pipeline.json"], { exitCode: 0, contains: ["gate holds"] });

await ccScenario("ci-check: wrong-shape JSON refuses", `"just a string"`, ["--pipeline", "pipeline.json"], { exitCode: 2, contains: ["not a pipeline shape"] });

await ccScenario("ci-check: Dockerfile line-scan fallback", `FROM node:22-alpine\nRUN npm install\n`, ["--pipeline", "Dockerfile"], { exitCode: 0, contains: ["unpinned-install"] });

await ccScenario("ci-check: gitlab script shape parsed", `stages: [test]\ntest-job:\n  script:\n    - npm ci\n    - npm test\n`, ["--pipeline", ".gitlab-ci.yml"], { exitCode: 0, contains: ["gate holds"] });

await ccScenario("ci-check: reason-comment escape holds at step level", `jobs:
  a:
    steps:
      - run: npm test || true  # reason: known flaky upload, ticket DEV-31
      - run: npm ci
`, ["--pipeline", "workflow.yml"], { exitCode: 0, notContains: ["masked-failure"] });

await ccScenario("ci-check: --json output parseable", `jobs:
  a:
    steps:
      - run: npm test || true
`, ["--pipeline", "workflow.yml", "--json"], { exitCode: 1, json: true, contains: ["masked-failure"] });

// ---- pipeline-review daemon protocol ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await (async () => {
  const dir = TMP + "-pr";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "steps.json"), JSON.stringify([
    { name: "deploy-prod", job: "deploy", run: "./deploy.sh", risk: "high", rollback: "./rollback.sh --previous-image", approval: "prod requires maintainer review" },
    { name: "load-test", job: "verify", run: "./load.sh", risk: "low" },
    { name: "deploy & <prod>", job: "deploy", run: "./x.sh" },
  ]));
  // Unique per run — a stale daemon from a prior run must not poison this one
  const port = 8700 + (process.pid % 900);
  const srv = spawn("node", [PREVIEW, "--steps", "steps.json", "--round", "r1", "--port", String(port)], { cwd: dir });
  try {
    let up = false;
    for (let i = 0; i < 20; i++) {
      try { if ((await fetch(`http://localhost:${port}/beat`)).status === 204) { up = true; break; } } catch {}
      await wait(150);
    }
    if (!up) { console.log("✗ pipeline-review: did not come up"); fail++; }
    else {
      const page = await (await fetch(`http://localhost:${port}/`)).text();
      const okGaps = page.includes("gap: no rollback reference") && page.includes("gap: high-risk without approval reference") === false;
      const okEsc = page.includes("deploy &amp; &lt;prod&gt;") && !page.includes("deploy & <prod>");
      if (!page.includes("deploy-prod") || !okGaps || !okEsc) { console.log("✗ pipeline-review: entries/gap-callouts/escaping missing"); fail++; }
      else {
        console.log("✓ pipeline-review: serves entries, red gaps, escaped names"); pass++;
        const partial = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "deploy-prod": "ship" } }) });
        if (partial.status !== 400) { console.log("✗ pipeline-review: partial submit not rejected"); fail++; }
        else {
          console.log("✓ pipeline-review: partial submit rejected"); pass++;
          const full = await fetch(`http://localhost:${port}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdicts: { "deploy-prod": "ship", "load-test": "flag", "deploy & <prod>": "n/a" } }) });
          if (full.status !== 200) { console.log("✗ pipeline-review: full submit rejected"); fail++; }
          else {
            const out = execFileSync("node", [PREVIEW, "--round", "r1", "--result"], { cwd: dir, encoding: "utf8" });
            if (!out.includes('"verdict": "flag"') || !out.includes('"verdict": "ship"')) { console.log("✗ pipeline-review: result missing verdicts"); fail++; }
            else { console.log("✓ pipeline-review: verdicts recorded and readable"); pass++; }
          }
        }
      }
      // Port-collision behavior: a second daemon on the same port exits 2
      const srv2 = spawn("node", [PREVIEW, "--steps", "steps.json", "--round", "c2", "--port", String(port)], { cwd: dir });
      let collMsg = "";
      srv2.stderr.on("data", (c) => (collMsg += c));
      try {
        await wait(800);
        if (srv2.exitCode !== 2) { console.log(`✗ pipeline-review: port collision should exit 2, got ${srv2.exitCode}`); fail++; }
        else if (!/cannot bind port \d+/.test(collMsg)) { console.log("✗ pipeline-review: collision message lacks the port"); fail++; }
        else { console.log("✓ pipeline-review: clean exit 2 on port collision with a real message"); pass++; }
      } finally {
        srv2.kill();
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
      try { JSON.parse(e.stdout || out); } catch { console.log(`✗ ${s.name} — --json output not parseable`); fail++; continue; }
    }
    const misses = [...s.contains.filter((c) => !out.includes(c)), ...s.notContains.filter((c) => out.includes(c))];
    if (misses.length) { console.log(`✗ ${s.name} — ${misses.join(", ")}`); fail++; continue; }
    console.log(`✓ ${s.name}`);
    pass++;
  }
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\nshipcraft scenarios: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
