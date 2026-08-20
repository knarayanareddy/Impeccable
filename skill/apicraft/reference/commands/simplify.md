# Command: simplify

Reduce surface complexity without breaking consumers. The API equivalent of codecraft's `simplify`:
consumers don't want more endpoints, they want fewer, better ones. Load `contract-floor.md` before
editing.

## The order of operations

1. **State the compatibility contract** — what must not change: existing paths, field names, status
   semantics, error codes, pagination behavior for any shipped consumer. Write it before the first
   edit.
2. **Delete what nobody calls.** Unused endpoints (verified by logs/metrics), redundant parameters,
   CRUD ritual with no consumer. Public APIs: deprecate first (`deprecate`); internal APIs: remove
   with the call sites in the same change.
3. **Merge lookalikes.** `getUserById` + `getUserByEmail` → `GET /users?id=` or `?email=`;
   `createX` + `createXFromY` → one create with an optional source. Merging is additive-with-aliases
   on public APIs, direct on internal ones.
4. **Flatten the payloads.** Remove wrapper levels (`{data: {data: ...}}`), collapse redundant meta,
   drop fields that restate the request. On public APIs, deprecate fields rather than delete.
5. **Collapse the error vocabulary.** Ten error codes that say the same thing → the standard set
   (`errors.md`); map legacy codes to canonical ones in the docs, keep serving the old strings.
6. **Cut the parameter soup.** Positional-ish query params with overlapping meaning → the filter
   vocabulary (`pagination.md`); default what can default; remove what's never used.
7. **Update the spec in the same change** — simplification that leaves spec drift is not
   simplification.

## Guardrails

- Compatibility contract verified before and after (spec diff + consumer tests if they exist).
- Simplify the *consumer-facing* confusion, not the server internals. If the server needs cleanup
  but the API is fine, that's a codecraft pass, not an apicraft one.
- Never simplify by silently dropping a field a consumer might read — deprecation or version bump,
  always.

## Exit criteria

- Endpoint/param/field counts quoted before and after; spec updated and diffed; consumer-facing
  behavior unchanged except the deliberate, documented changes.
