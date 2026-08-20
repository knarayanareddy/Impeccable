# Command: monitor

Security observability: audit logs, detection, and alerting (`security-floor.md` #9 is the
authority). You cannot respond to what you never saw — detection is the second half of every
control.

## Steps

1. Map what's logged today against what security needs: authentication events (success and
   failure), authorization denials, input-validation failures, admin actions, secret-manager
   access, rate-limit hits. The gaps are the work.
2. Wire the missing events with context: who, what, when, source — structured, correlation
   IDs, and **redacted** (credentials never enter logs — `domains/secrets.md`).
3. Build the detection signals over the logs (`domains/abuse.md`): auth-failure velocity
   (brute force), authz-denial spikes (probing), impossible-travel/geo anomalies, admin-action
   anomalies, dependency-audit regressions.
4. Alert on the signals with owners and severities: P1 for credential compromise indicators,
   P2 for probing, P3 for hygiene drift. An alert that pages nobody is a decoration.
5. Make the logs tamper-evident and retained: append-only storage, retention per the data
   classes, access to logs itself restricted (logs contain the truth and half the secrets).
6. Verify: the detection signals fire on a synthetic attack (the canary), the alerts reach a
   human, and the redaction holds on a planted credential.

## Exit criteria

- The security event set logged with context and redaction; the detection signals wired and
  tested with a canary; alerts owned and retention policy recorded.

## Rules

- Logging the event is the control; alerting on the pattern is the defense. Both, or it's a
  diary.
- Never log credentials, tokens, or full request bodies — the log is a credential store unless
  you deny it the job (`domains/secrets.md`).
- Detection without a tested canary is faith — the canary proves the pipeline end-to-end.
