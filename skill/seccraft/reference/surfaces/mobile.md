# Surface sheet: Mobile (iOS/Android)

Loaded with the relevant domains when the surface is a mobile app. The surface-native attack
surface and controls; the compass domains still hold.

## The attack surface (mobile-shaped)

- **The client is fully untrusted**: everything in the app is extractable — the security
  boundary is the server, never the client (`domains/trust.md`, at maximum strictness).
- **The device is hostile**: rooted/jailbroken devices, emulators, proxy inspection — design
  for it, detect where it pays (attestation for high-value surfaces, not as the only wall).
- **Local data is a target**: the app's storage, caches, and logs sit on a device the
  attacker owns (`domains/data.md`'s in-use state).

## The controls to wire (the mobile checklist)

| Control | Where |
|---|---|
| TLS with **certificate pinning** for the API | `lock`-equivalent, mobile |
| **Secrets never ship in the bundle** — runtime retrieval from the backend, scoped tokens | `secrets` |
| **Keychain / Keystore** for credentials (per the platform's secure storage), never
  plaintext prefs/files | `data.md` |
| **Secure local storage**: encrypt sensitive caches; no PII in logs or crash reports | `data.md`, `monitor` |
| AuthN with **short-lived tokens + revocation**, biometrics on sensitive actions | `authn.md` |
| **Root/jailbreak detection + Play/SafetyNet-style attestation** where the risk class demands | `abuse.md` |

## The mobile-specific traps

- **Hardcoded API keys in the app** — extractable in minutes from any published build
  (`anti-patterns.md` S1, the checker flags the source; the bundle is the same problem
  invisible).
- **TLS bypass in debug builds shipping to prod** (`debuggable: true`, `NSAppTransport
  Security` exceptions) — the mobile `debug: true` (K1's twin).
- **Logging tokens/PII** in the device log (`secrets.md`'s hygiene rules apply on-device).
- **Deep links with unvalidated input** — treat them like any untrusted boundary
  (`injection.md`).

## Bans

Secrets in bundles · plaintext credential storage · debuggable prod builds · TLS exceptions ·
PII in device logs · client-only security of any kind.
