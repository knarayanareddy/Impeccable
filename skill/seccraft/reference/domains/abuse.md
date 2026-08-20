# Domain: Abuse

Abuse defense answers "how does the system behave when attacked at volume?" — brute force,
scraping, stuffing, denial of service. Availability is a security property, and the attacker's
cost model is the design target.

## The attack classes and their controls

| Attack | The control |
|---|---|
| Brute force on login | Rate limit per account + per IP; lockout with backoff; breached-password check |
| Credential stuffing | Same as above + the lockout must be per-account (attackers spread across IPs) |
| Scraping / enumeration | Rate limits + pagination caps (`apicraft`'s pagination) + suspicious-pattern detection |
| API abuse | Per-key quotas, throttling with `Retry-After` + visible rate-limit headers |
| DoS via expensive endpoints | Caching, work budgets, queue caps, degradation mode (`perfcraft`'s harden) |
| Bot abuse on public forms | Honeypots, proof-of-work for anonymous writes, behavioral signals |

## Rate limiting, done as a control

- **Limits are layered:** global, per-IP, per-account, per-key — the per-*identity* limit is
  the one that matters against distributed attackers.
- **429 with Retry-After and visible headers** — limits that surprise are failures, not
  controls (`apicraft`'s http domain agrees).
- **Lockout beats endless 429s for auth endpoints** — a login at 10 failed attempts is an
  attack; tell it so (temporary lock + recovery path for the real user).

## The economy of abuse

- **Make abuse cost more than value.** Proof-of-work for anonymous actions, CAPTCHAs only where
  they're the last resort (they cost real users too), throttling that degrades bots more than
  people.
- **Monitor the abuse signals** (`monitor`): failure-rate spikes, velocity anomalies,
  impossible travel — detection is the second half of every control.

## The availability half

- Design for the knee (`perfcraft`): load-shedding, degradation, and fail-closed behavior under
  attack — a DDoS that takes you down cleanly is a success; one that corrupts data is a breach.
- Abuse controls themselves must fail closed: the rate limiter's storage failing must not open
  the gates (`security-floor.md` #3).

## Bans (recap)

No rate limits on auth or expensive endpoints, surprise 429s, per-IP-only limiting, lockouts
that lock out the victim, controls with no monitoring, availability designed only for happy
traffic.
