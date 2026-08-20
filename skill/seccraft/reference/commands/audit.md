# Command: audit

Defect scan: authz gaps, injection, secrets, crypto, config, and dependency hygiene. Finds and
ranks — it does not fix. No code or config edits.

## Steps

1. Run `scripts/check.mjs --target <path>` for the deterministic set (hardcoded credentials —
   redacted, private keys, interpolated SQL, insecure hashes, weak JWTs, eval/Function/document.
   write, innerHTML, command concat, Math.random tokens, http URLs, permissive CORS, auth-
   disabled decorators, insecure cookies, stack traces in responses, missing security config).
2. Run the project's security tooling: SAST, dependency audit, secret scan — and reconcile the
   tool findings with the inspection (tools find the mechanical; you find the contextual).
3. Inspect what the checker can't see:
   - **Authz** (`domains/authz.md`): every resource access checked at object level? the single
     authorization layer actually single? any route skipping it?
   - **Authn** (`domains/authn.md`): password hashing, session/token lifecycle, MFA on
     sensitive surfaces, recovery flows.
   - **Injection** (`domains/injection.md`): each sink's defense — bound params, escaping, no
     eval, allowlisted fetches/redirects.
   - **Secrets** (`domains/secrets.md`): secret manager usage, rotation paths, logging
     redaction.
   - **Config** (`lock`): production defaults, headers, CORS, cookies, debug off.
   - **Data** (`domains/data.md`): classification applied, minimization, retention.
4. Output a ranked punch list: severity (Critical / High / Medium / Low), file:line, rule, and
   the fix. Criticals = security-floor violations. Sort by severity, then by exploitability.

## Rules

- Cite file:line and the exact mechanism for every finding — never vague impressions.
- Audit does not edit. The fix is a follow-up command (`harden`, `authz`, `sanitize`,
   `secrets`, `lock`...).
- Unverified impact is labeled "to threat-model", not asserted — audit maps, `threatmodel`
  judges.

## Exit criteria

- The punch list ranked and delivered, deterministic + tool + inspection findings separated; a
  one-line verdict and counts per severity.
