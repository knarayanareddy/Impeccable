# Domain: Crypto

Cryptography is the rare field where creativity is a defect. The craft: use the boring, current,
standard constructions — and know which ones are already dead.

## The current constructions (use these)

| Purpose | Use |
|---|---|
| Password hashing | argon2id (preferred) · bcrypt · scrypt — with calibrated cost |
| Encryption (data at rest) | AES-256-GCM or chacha20-poly1305 (authenticated modes; GCM = confidentiality + integrity) |
| Key derivation | PBKDF2 / scrypt / argon2 from a passphrase (never raw passphrase-as-key) |
| Integrity / fingerprints | SHA-256+ (BLAKE2/3 fine) — MD5/SHA-1 only for legacy interop, never security |
| Randomness | CSPRNG: `crypto.randomBytes`, `secrets`, `/dev/urandom` — never `Math.random` |
| TLS | 1.2 minimum, 1.3 preferred; modern cipher suites; HSTS |

## The broken list (recognize and replace)

- **MD5 / SHA-1** for passwords, signatures, or security hashing (`anti-patterns.md` C1).
- **ECB mode** — identical blocks leak structure (the penguin). Never.
- **Hardcoded IVs/nonces** — the IV must be fresh and random per encryption (GCM nonce reuse =
  key compromise).
- **`alg: none` JWTs** — unsigned tokens (`anti-patterns.md` A3).
- **Hand-rolled ciphers and "custom obfuscation"** — encryption theater; attackers reverse it in
  an afternoon (`anti-patterns.md` C2).
- **Keys from raw passwords** — brute-forced in minutes without a KDF (`anti-patterns.md` C3).
- **`Math.random` for anything a token or ID derives from** — predictable = guessable
  (`anti-patterns.md` I6).

## The operational rules

- **Key management is separate from data** — keys in KMS/vault, data in storage. Encryption with
  the key on the same disk is a checkbox, not a control (`anti-patterns.md` C4).
- **Nonce/IV discipline** — random per message, never reused, never sequential-guessable.
- **Authenticated encryption only** — encrypt-then-MAC or an AEAD mode; plain CBC without a MAC
  is malleable.
- **Version your crypto** — key versions and algorithm versions in the ciphertext metadata, so
  you can rotate without a flag day.
- **Deprecation path exists** — when an algorithm dies (and they do), the migration is a
  designed operation, not a scramble (`modernize`-style thinking from dbcraft).

## Bans (recap)

MD5/SHA1-for-security, ECB, hardcoded IVs, hand-rolled ciphers, raw-passphrase keys, Math.random
tokens, unaudited "encryption" theater, keys with the data, nonce reuse.
