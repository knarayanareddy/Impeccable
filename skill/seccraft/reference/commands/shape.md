# Command: shape

Define the security requirements before building: the threats the feature faces and the controls
that answer them. Security shaped early is a design; retrofitted, it's an audit finding.

## Steps

1. Restate the feature's data flows: what enters, what's stored, what's returned, who can call
   it — and which data classes it touches (`domains/data.md`).
2. Draw the trust boundaries (`domains/trust.md`): where untrusted input crosses, what the
   feature trusts, and what an attacker would target.
3. For each boundary, list the threats (spoofing, tampering, disclosure, DoS, elevation) and
   the control that answers each — authn, object-level authz (`domains/authz.md`), validation
   and escaping (`domains/injection.md`), rate limits (`domains/abuse.md`), crypto where data is
   sensitive (`domains/crypto.md`).
4. Write the security acceptance criteria: the tests that prove the controls (the authz matrix,
   the injection cases, the rate-limit behavior) — security requirements that can't be tested
   are wishes.
5. Flag what the feature must *not* do: no storing credentials, no logging PII, no new secret
   in code, no default-open route (`security-floor.md`).
6. Deliver: boundaries → threats → controls → acceptance tests, and wait for approval before
   building.

## Rules

- Shape never edits code. It ends where implementation begins.
- Every threat names a control; every control names a test. Threat-control-test is the unit of
  security requirements.
- If the feature can't meet the floor by design (a necessary default-open case), that's a shape
  finding: escalate it now, never discover it in the audit.
