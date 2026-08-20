# Command: telemetry-check

The question-first doctrine as a mechanical gate: validate the telemetry **config shapes** —
SLO definitions, alert definitions, and metric vocabularies — and fail on gaps. The `slo`,
`alert`, and `metric` commands' contracts, in tool form.

## Usage

```bash
node <skill-dir>/scripts/telemetry-check.mjs --slos slo.yaml --alerts alerts.yaml --metrics metrics.json
node <skill-dir>/scripts/telemetry-check.mjs --slos slo.yaml --json
```

Exit 0 = all shapes valid · exit 1 = gaps · exit 2 = usage or parse refusal. At least one
input is required; each parses JSON natively or a YAML-subset block shape
(`slo:` blocks, `alerts:` lists).

## What it enforces

- **SLOs**: the quartet — `sli`, `target`, `window`, `owner` (each missing member is a gap);
  a `100` / `1.0` target is flagged as unspendable (`anti-patterns.md` S3).
- **Alerts**: the actionability contract — `owner`, `runbook`, and a `condition`/`expr`
  (`alerts.md`: the page names the action, the runbook, and the owner, or it doesn't exist).
- **Metrics**: the vocabulary — `name`, `type` (counter/gauge/histogram), and `question`
  (`telemetry.md`: a metric must name the question it answers).

## Honesty rules

- A file that parses to **zero** entries exits 2 — "no gaps found" on an empty parse is a lie.
- Missing members are gaps, never silently defaulted.

## CI wiring

`--json` + exit codes make this a config-repo gate: validate `slo.yaml` and `alerts.yaml` on
every change; a definition that loses its owner or runbook fails the build.
