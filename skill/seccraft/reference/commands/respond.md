# Command: respond

Incident response basics: the runbook and the recovery posture (`security-floor.md` Reflexes —
the breach question). The moment a breach happens, the team's options were mostly decided
beforehand — this command decides them now.

## Steps

1. Enumerate the incident classes for this system: credential leak, session compromise, data
   exfiltration, injection success, dependency zero-day, insider misuse. Per class, not per
   hypothetical — the classes the architecture actually faces.
2. For each class, write the runbook skeleton:
   - **Detect** — which signal/alerts fire (`monitor`)?
   - **Contain** — the immediate kill-switch: revoke the credential, rotate the keys, block
     the route, freeze the account. The containment action exists and is *tested* before the
     incident (`secrets`' revocation path is this).
   - **Assess** — what's the blast radius? Which data classes were exposed (`domains/data.md`)?
     What do the audit logs say?
   - **Notify** — who gets told, in what order, under what obligations (regulatory windows)?
   - **Recover** — rotate everything touched, patch the root cause, restore from clean state.
   - **Learn** — the postmortem: which design decision failed, and what changes so this class
     can't recur.
3. Wire the operational bits: the on-call path, the secret-revocation runbook, the backup/
   restore verification, the comms template.
4. Dry-run the top class: simulate the alert → containment → assessment loop in an exercise.
   A runbook that has never been walked is a document.

## Exit criteria

- One runbook per incident class with detect/contain/assess/notify/recover/learn; the
  containment actions tested; the on-call path confirmed; the exercise recorded.

## Rules

- Respond prepares the *response*; it doesn't fix the vulnerabilities — the fixes belong to
  `harden`/`authz`/`sanitize`/`secrets`.
- Containment beats investigation: revoke first, understand later — a rotated credential is
  never the wrong first move.
- The postmortem's output is design change, not blame: every incident rewrites a part of
  SECURITY.md.
