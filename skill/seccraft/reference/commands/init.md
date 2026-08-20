# Command: init

Capture the security context and policy so every later command reads the same facts. One-time
setup per project.

## Steps

1. Inspect, don't interrogate. Read the authn/authz code paths, the config (headers, CORS,
   cookies, TLS), the dependency manifests, and any existing security tooling or docs. Extract
   the facts.
2. Ask the user only what the code can't answer:
   - The data classes: what's public / internal / confidential / restricted here (`domains/data.md`)?
   - The compliance context (GDPR? SOC 2? PCI? — which requirements bind?)
   - The threat context: public-facing or internal? multi-tenant? money or health data?
   - The security tooling in use: SAST, dependency audit, secret scanning — and where they run.
   - The incident path: who gets paged, and what's the escalation (`respond`)?
3. Write `SECURITY.md` at the project root (or `.seccraft/SECURITY.md` if the root is crowded):
   - Data classification per field class and the policy each class triggers
   - Auth model: authn scheme, session/token policy, the authz model (RBAC/ABAC) and where the
     single authorization layer lives
   - Trust boundaries at a glance (entry points and what they validate)
   - Tooling: scanners and their CI wiring
   - Compliance obligations and their owners
   - Incident response pointer (runbook location, escalation)
4. End with the recommended next step: usually `threatmodel` for the critical component,
   `audit` if the code already looks security-naive, `shape` for new work.

## Rules

- Facts only — SECURITY.md is shared memory, not an essay. Keep it <80 lines.
- Never ask what the code or config already answers; never re-ask across sessions.
- No code edits during init. This command captures context.
