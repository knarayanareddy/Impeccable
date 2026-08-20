# Command: budget (check mode)

The mechanical budget gate: apply the budget file to a measurements file and fail on any
breach — the perf floor's "budgets in CI" doctrine as a tool.

## Usage

```bash
node <skill-dir>/scripts/budget-check.mjs --budget budget.json --measurements m.json
node <skill-dir>/scripts/budget-check.mjs --budget budget.json --measurements m.json --json
```

Exit 0 = within budget · exit 1 = breach or invalid budget shape · exit 2 = usage error.

Measurements file shape:

```json
{
  "resourceSizes":  { "script": 180, "image": 420, "total": 950 },
  "resourceCounts": { "third-party": 8, "font": 2 },
  "metrics":        { "LCP": 2400, "INP": 180, "CLS": 0.08 },
  "source": "lighthouse-ci run #412"
}
```

## What it enforces

- **Breaches**: resource sizes, resource counts, and metrics against their caps.
- **The percentile rule**: every metric budget must state its percentile — a budget without
  one is a wish, not a budget, and the check fails the *shape* even when the numbers pass.
- Unmeasured entries are skipped, not failed — wire the measurement source before trusting a
  green.

## CI wiring

`--json` + exit codes make this a CI gate: generate the measurements from the run
(Lighthouse CI, a probe script), check, fail the build on breach. Same doctrine as the other
suite checkers — the gate blocks, the log explains.
