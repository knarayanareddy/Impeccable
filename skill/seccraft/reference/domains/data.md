# Domain: Data

Data protection is where security becomes privacy: what you collect, where it flows, how long it
lives, and who can ever see it. The most robust control is the field you never stored.

## Minimization (the first control)

- **Collect what the job needs, store what the product requires, keep what the law permits.**
  Every field in the schema gets the question: why do we have this? The honest answer is often
  "habit" (`anti-patterns.md` D2).
- **Log and return the minimum** — request bodies wholesale into logs is a PII warehouse
  (`anti-patterns.md` D3); responses that echo the request teach attackers what you store.
- **Pseudonymize/aggregate where identity isn't needed**: analytics on hashed identifiers,
  stats on aggregates.

## Classification (name the sensitivity)

- Classify data per field/table: public / internal / confidential / restricted. The class decides
  encryption, access, logging, retention, and breach response — one policy, applied by class,
  not per-field improvisation.
- PII and credentials get the top class by default; "it's just a username" is how the leaks
  start.

## Protection in the states

- **In transit:** TLS everywhere internal and external (internal networks are compromised too —
  `domains/trust.md`); encrypted backups.
- **At rest:** encryption for confidential/restricted classes, keys in KMS, key rotation
  (`domains/crypto.md`).
- **In use:** least-privilege access (the DB user can't read the PII table it doesn't need),
  field-level access control where the class demands it, masked display (masked card numbers,
  truncated identifiers).

## Retention and deletion

- **Retention policy per class** — stated, enforced, automated. Data that outlives its purpose is
  a liability with a timestamp.
- **Deletion is real deletion**: soft-delete rows are still data; anonymization pipelines for
  analytics; the backup problem is answered (restores re-create deleted data — policy covers
  it).
- **Right-to-erasure flows work end-to-end** — the deletion request reaches every store,
  including caches, replicas, and logs, within the promised window.

## The breach-readiness check (`review` asks it)

For the most sensitive class: where does it live (every copy)? Who can access it (every role)?
What's logged about it? What would the incident response be (`respond`)? If any answer is "we'd
have to look", the data posture is unfinished.

## Bans (recap)

Collect-everything, PII in logs, no classification, plaintext sensitive data, no retention
policy, fake deletion, masked-only-in-the-UI, keys with the data.
