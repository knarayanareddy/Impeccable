# Command: secrets

Secrets management: move, rotate, scan (`domains/secrets.md` is the authority). The pass that
turns credentials from source-code accidents into managed, audited, revocable assets.

## Steps

1. Inventory every secret the target uses (checker + inspection): API keys, DB credentials,
   signing keys, tokens — in code, config, env dumps, and CI scripts.
2. For each, apply the lifecycle:
   - **Move** — into the secret manager (vault/KMS/platform store), scoped per environment and
     service, injected at deploy.
   - **Rotate** — every secret that was ever in code or config is burned: new value, old value
     revoked, the rotation verified end-to-end (the committed-secret protocol: rotation is the
     fix, deletion is not — `domains/secrets.md`).
   - **Scope** — least privilege: the key that reads bucket X, the token bound to service Y.
   - **Audit** — access to the secret manager is logged; rotation is on a schedule, not a
     memory.
3. Wire the guards:
   - Pre-commit secret scanning (a CI gate, not a friendly warning) — including regexes for the
     project's own key formats.
   - Log redaction for request bodies/headers/query strings (`domains/secrets.md` hygiene).
   - No-config-secrets rule: config files reference locations, never values.
4. Verify: the old values fail, the new values work, the scanner catches a planted test secret,
   and the rotation path is a one-command operation.

## Exit criteria

- Zero secrets in code/config/git; all secrets managed + scoped + rotated; scanning and
  redaction wired; the rotation runbook tested.

## Rules

- Never rotate by "commenting out" the old secret and adding a new one next to it — the old one
  is still there for the next grep.
- If the secret was in a public repo at any point, history scrubbing is not optional hygiene —
  state it and execute it (or re-key everything it touched).
- The inventory is the deliverable's skeleton: an unlisted secret is an uncontrolled one.
