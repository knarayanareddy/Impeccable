# Domain: Infrastructure

Infrastructure-as-code is the environment's memory. The craft: declarative, versioned,
reconciled — and the drift between the code and reality is a detected bug, never a remembered
exception.

## The IaC contract

- **Declarative over imperative** — the repo describes the *desired state* (Terraform, Pulumi,
  CloudFormation, Kubernetes manifests); the tool reconciles reality toward it. Hand-run scripts
  describe a moment in someone's terminal, not a state.
- **Versioned with the code** — infrastructure lives in the same repo (or a first-class sibling),
  reviewed in PRs, changed through the same pipeline. The wiki that describes prod is a rumor.
- **One source of truth** — the repo is the truth; reality is checked against it. If they
  disagree, the question is *who changed reality*, not *which is right* — and the answer is
  logged.

## The reconciliation loop (`env` runs it)

1. **Plan/diff on a schedule or in CI** — the described state vs reality (`terraform plan
   -detailed-exitcode`, drift detection jobs): zero drift is the passing grade.
2. **Drift pages** — a detected difference is a ticket with an owner, not a shrug. Repeated drift
   from the same source (a hand fix, a console change) gets the *source* fixed: the person gets
   the pipeline, not the lecture.
3. **Snowflake capture** (`anti-patterns.md` E2): a hand-tweaked server is either captured into
   IaC or rebuilt from it — the manual fix must die with its author.

## Destruction is guarded

- `terraform destroy`, `kubectl delete`, `rm -rf` in pipelines are approval-gated, reversible
  where possible, and logged (`anti-patterns.md` I2). A destructive op that can run un-reviewed
  is an outage wearing a pipeline.
- Every destructive change states its recovery: what it deletes, what recreates it, and the
  restore test (`domains/recovery.md`).

## Environments as products

- Each environment's IaC states its parity contract (`domains/environments.md`): stage is prod's
  twin at smaller scale; the differences are declared, not discovered.
- Ephemeral environments (per-PR) are the modern rehearsal room: created from the same IaC,
  destroyed after — proving the environment is reproducible, not just producible.

## Bans (recap)

Hand-applied infra, wiki truth, unreconciled drift, unguarded destruction, snowflakes preserved,
environments that can't be rebuilt from the repo.
