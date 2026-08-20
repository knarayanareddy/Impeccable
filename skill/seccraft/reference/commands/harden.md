# Command: harden

The fix pass: authentication, authorization, validation, crypto, and headers — bring the target
to the security floor (`reference/security-floor.md` is the authority). The signature fix command.

## Steps

1. Take the ranked findings from `audit` (or the floor checklist if auditing wasn't run) and
   state the fix list with one change per finding. If the surface is a web application, an
   API/service, or a mobile app, the matching `reference/surfaces/` sheet is the control
   checklist's surface authority.
2. Fix in impact order:
   - **Authz first** (`domains/authz.md`): object-level checks on every resource access; the
     single authorization layer; deny-by-default routes.
   - **Secrets** (`domains/secrets.md`): move hardcoded values to the manager, rotate the burned
     ones (the committed-secret protocol — rotation is the fix, not deletion).
   - **Injection** (`domains/injection.md`): parameterize SQL, escape/sanitize HTML, argument
     arrays for shell, allowlist fetches/redirects.
   - **Authn** (`domains/authn.md`): password hashing (argon2id/bcrypt), constant-time compare,
     session/token lifetimes and revocation, MFA where the data class demands.
   - **Crypto** (`domains/crypto.md`): replace broken-list constructions with the current ones.
   - **Config** (`lock` covers the header/CORS/cookie batch — pair with it).
3. Each fix carries its proof: the authz matrix test, the injection case, the rotation record.
   A hardening change without a test is a hardening claim.
4. Run the checker + the security tooling after the batch; quote before/after finding counts.

## Exit criteria

- The fix list resolved (fixed or explicitly deferred with an owner and date); every fix
  tested; checker clean on the target; the floor's items verifiable.

## Rules

- Harden fixes findings; it doesn't redesign features or add new ones.
- A fix that weakens functionality without the product's sign-off isn't hardening, it's
  sabotage-by-policy — negotiate the tradeoff openly.
- Never harden around a broken trust model — if the model itself is wrong, `threatmodel` first.
