# Domain: Secrets

Secrets are the keys to the kingdom, and their management is a discipline with exactly one rule
that matters: **a secret is never written, only referenced.** Everything else follows.

## The lifecycle

1. **Generate** — with a CSPRNG, at sufficient entropy (32+ bytes for API keys), per environment,
   per scope. Never reuse; never derive "cleverly".
2. **Store** — in a secret manager (vault, KMS, the platform's secret store), scoped to the
   service that needs it, with access audit. Not in code, config, images, or git
   (`anti-patterns.md` S1/S2).
3. **Inject** — at deploy time, into the environment (or a runtime secret fetch), read once into
   memory, never printed (`anti-patterns.md` S3).
4. **Use** — with least privilege: the key that can only read bucket X, the token scoped to
   service Y. Blast radius is a design parameter (`domains/trust.md`).
5. **Rotate** — on schedule, on suspicion, and instantly on exposure. Rotation must be a
   one-command operation; a secret that's hard to rotate is a secret that lives too long
   (`secrets`).
6. **Revoke** — the path exists before it's needed: who deactivates a leaked credential at 2 a.m.
   and how fast (`respond`).

## The committed-secret protocol

A secret that touched git is compromised — **rotation is the fix, deletion is not:**
1. Rotate immediately (the old value is burned).
2. Remove from the code and git history if the repo is (or was) public; rewrite history or
   re-key — and know that any clone that exists anywhere still has it.
3. Check the blast radius: what could that secret access? Audit those systems for misuse.
4. Add the pre-commit secret scanner so it can't happen again (CI gate, not a friendly warning).

## The hygiene rules

- **No secrets in logs** — redact request bodies, headers, and query strings by deny-list;
  structured logging with a redaction layer (`anti-patterns.md` D3).
- **No secrets in config files** — config references the secret's location, never its value.
- **No secrets in environment dumps** — the "print all env vars for debugging" is a
  credential-storage bug.
- **Per-environment secrets** — dev keys never touch prod, and prod keys never touch dev
  machines (the demo key in prod is the classic (`anti-patterns.md` S4)).

## Bans (recap)

Secrets in code/git/config/logs, un-scoped keys, no rotation path, deletion-as-response,
shared secrets across environments, CSPRNG-free generation.
