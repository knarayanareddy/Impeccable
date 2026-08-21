# SHIP.md — example shape

The canonical delivery-context file written by `init`. Copy this shape; keep it tight.

```markdown
# Environments & parity
dev (lag allowed: data) → stage (prod's twin) → prod
parity contract: same versions/topology; differences: data, scale, secrets

# Pipeline inventory
workflows: .github/workflows/ci.yml · gate stack: lint→test→build→scan→deploy→verify
artifact: built once, digest-referenced

# Deploy policy
strategy: rolling default, canary for risky · approval: prod requires review
health checks: journey-level smoke gates each rollout batch

# Rollback contract
trigger: health fail or error rate > X for 5m · mechanism: previous digest via ./bin/rollback.sh
rehearsal: stage, before each risky release · schema: expand/contract only

# Secrets
store: <vault> · scoped per environment · rotation: quarterly + on exposure

# Delivery targets
pipeline: < 12 min · deploys: >= 5/week · change failure rate: < 15% · MTTR: < 30m
```
