# Domain: Versioning

Versioning is the discipline of keeping promises while still changing your mind. The policy is
simple to state and expensive to ignore: **additive changes are free; everything else is breaking —
and breaking changes are a process.**

## What's breaking (the ledger)

| Change | Breaking? |
|---|---|
| Add an endpoint / add an optional field / add an enum value / add an error code | No — free |
| Add a *required* field to a response | No (consumers ignore it) — but avoid |
| Add a required field to a request / narrow an accepted input / tighten validation | Yes |
| Rename or remove a field / change a field's type / change an enum's meaning / delete an enum value | Yes |
| Change pagination style, error envelope, casing, date format | Yes |
| Change semantics of existing behavior (even a "bugfix" consumers depended on) | Yes |
| Increase a rate limit / relax permissions | No |

When in doubt, treat it as breaking — the cost of a version bump is smaller than the cost of a
surprised consumer.

## Strategies

- **URI versioning:** `GET /api/v1/orders` — the most common; major versions only, never `/v1.1`
  (`anti-patterns.md` R5-adjacent). Pros: visible, cacheable, trivially routable. Cons: new URL per
  version; pick once.
- **Header/accept versioning:** same URL, `Accept: application/vnd.acme.v2+json` — cleaner URLs,
  worse cache/CDN behavior, easier to forget. Default when unversioned must be explicit.
- **Date-based:** `/api/2026-08-20/...` — used by some platforms; high ceremony.
- **GraphQL:** additive-only in practice — new fields, new types, `@deprecated` for removals; no
  breaking changes without a whole new schema/service.
- **gRPC:** additive fields, `reserved` for removed ones; a breaking change = new package or service.

Pick one, write it in `init`'s output, follow it everywhere.

## The compatibility window

- Support N and N-1 for a stated period (e.g., 12 months), announced in the changelog.
- A new major version ships only when breaking changes have accumulated enough value to justify it —
  not per change. Batching breakage respects consumers' migration budgets.
- Migration guides per version: what changed, why, and the mechanical path (new field, new header,
  new URL).

## The deprecation protocol (details in `commands/deprecate.md`)

1. Announce in the spec + changelog, with a date.
2. Emit `Deprecation: true` + `Sunset: <date>` headers (draft RFC) on the affected endpoint.
3. Keep serving during the window; monitor usage; nothing is removed while real consumers remain.
4. Remove only after the sunset date with the evidence of zero meaningful usage.

## The soft rules

- Never change a `code` string's meaning; add new codes.
- Never reuse a removed field name with a new meaning — resurrect the name, resurrect the confusion.
- Changelogs are part of the contract: every consumer-facing change appears with version, date, and
  migration impact.

## Bans (recap)

Silent breaking changes, semver-in-path, per-change version bumps, unbounded windows (or none),
deprecated-without-successor, resurrected names.
