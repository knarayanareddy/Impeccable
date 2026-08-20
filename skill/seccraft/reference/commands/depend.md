# Command: depend

Dependency hygiene: pin, audit, update, SBOM (`security-floor.md` #8 is the authority). The
supply chain is part of the attack surface — a known-vulnerable dependency is a known breach
with a CVE number.

## Steps

1. Inventory the dependency posture: lockfiles present and committed? manifests pinned
   (exact versions) or floating? how recent is the last audit?
2. Run the dependency audit (the ecosystem's tool: `npm audit`, `pip-audit`, `osv-scanner`,
   `govulncheck`, Dependabot/Renovate) and triage the findings by severity and *reachability* —
   a critical CVE in a transitive dev-only tool is a different urgency than one on the request
   path.
3. Fix in impact order:
   - **Upgrade** where the patched version exists and the breaking cost is low.
   - **Remove** the dependency that's pulling the vulnerable transitive (replace with a smaller
     alternative or hand-rolled code — `prune`-style thinking from perfcraft).
   - **Mitigate + ticket** where the upgrade is blocked (breaking changes, no patch): document
     the mitigation (is the vulnerable path even reachable here?), set the upgrade date.
4. Pin everything: exact versions in the lockfile, committed to the repo; dependency updates
   become reviewable PRs (automated bumps + human review), not silent drift.
5. Wire the CI audit gate: new vulnerabilities of a severity threshold fail the build; the
   SBOM is generated in the pipeline (the supply-chain inventory for incident response).

## Exit criteria

- Audit run and triaged with reachability; fixes merged or mitigated-with-ticket; lockfiles
  pinned and committed; the CI gate on; the SBOM generated.

## Rules

- Never "upgrade everything blindly" — a major-version cascade during a security pass is how
  outages hide in good intentions; upgrade what the finding requires, schedule the rest.
- Reachability triage is the craft: two CVEs with different blast radii are two different
  tickets.
- The gate must block, not notify — a dependency audit that emails and passes is decoration.
