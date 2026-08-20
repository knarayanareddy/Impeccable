# TESTS.md — example shape

The canonical test-conventions file written by `init`. Copy this shape; keep it tight.

```markdown
# Frameworks & commands
unit: <jest --testPathPattern='\.unit\.'> · integration: <pytest -m integration>
e2e: <playwright test> · coverage: <vitest --coverage>
flaky tracking: <runner retry logs + the quarantine board>

# Directory conventions
src/**/*.unit.test.ts (units) · tests/integration/ (seams) · e2e/ (journeys)

# Pyramid policy
unit: <ms per test, thousands of cases> · integration: <seconds, real seams via
Testcontainers> · e2e: <the 5-20 critical journeys, smoke per PR / full nightly>

# Risk tiers & coverage policy
Tier-1 (money, auth, data integrity): 90% + mutation-tested quarterly
Tier-2 (core workflows): 70% · Tier-3 (formatting): no floor
coverage gates are per-tier, never repo-wide

# CI wiring
per-PR: lint + unit + smoke e2e (2 min) · nightly: full e2e + mutation run
`.only` and `.skip` blocked at the gate

# Flake policy
two flakes = quarantined WITH a ticket; fixes land in /testcraft flaky
```
