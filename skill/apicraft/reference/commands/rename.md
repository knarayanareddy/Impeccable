# Command: rename

Rename fields or paths safely. In APIs, a rename is a *breaking change by definition* — consumers
parse by name. The craft is in making it survivable.

## The decision tree

1. **Has the name ever shipped to a consumer?**
   - **No (unreleased / internal):** rename directly, update all call sites, spec, and tests in one
     change. Done.
   - **Yes (public / partner):** continue below.
2. **Choose the mechanism** (`versioning.md`):
   - **Additive alias** (preferred when the platform allows): ship the new name *alongside* the old.
     Requests accept both; responses include both during the window (or the new one with the old
     behind `expand=legacy_fields`). Old name → `deprecated: true` with the successor in the spec.
   - **New version:** rename in `/v2`, keep `/v1` untouched, run the deprecation protocol on v1.
3. **Deprecate with a path** (`deprecate`): spec note, `Deprecation`/`Sunset` headers, changelog
   entry, migration example (old → new), and a usage-monitoring plan.
4. **Update everything the name lives in:** spec, examples, SDKs, docs, error codes if affected,
   webhook payloads (field renames in events are breaking too).
5. Verify: spec diff intentional, old names still accepted where promised, checker clean.

## Naming the new name

- State the claim precisely (`naming` rules from API.md vocabulary): `external_id` not `id2`.
- Never reuse a retired name for a new meaning (`versioning.md`) — resurrecting a name resurrects
  every integration that still sends it.
- If the new name isn't clearly better than the old, don't rename — deprecation cycles are tax, and
  a lateral rename pays tax for nothing.

## Rules

- A rename that ships without a deprecation/alias path is a breaking change delivered as a surprise
  — the cardinal sin (`contract-floor.md`).
- Rename the *vocabulary* everywhere it appears in one release: half-renamed APIs are worse than
  unrenamed ones.
- Record the rename in API.md's frozen vocabulary list.

## Exit criteria

- Old name deprecated with successor, new name in the spec, consumers can migrate mechanically;
  no silent breaking change.
