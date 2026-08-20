# Command: deprecate

Sunset an endpoint or field with a migration path. Deprecation is a product decision executed as a
protocol — done right, consumers migrate on their schedule; done wrong, you ambush them.

## The protocol

1. **Successor first.** There is no deprecation without a replacement: the new endpoint/field/version
   exists and works before the old one is marked. (Exception: the feature itself is being removed —
   then the migration path is "delete your data / export first", stated explicitly.)
2. **Announce in the spec and changelog:** `deprecated: true` + description naming the successor and
   the sunset date. The spec is the notice, not a blog post.
3. **Emit the headers** on the affected endpoint: `Deprecation: true` and `Sunset: <RFC 3339 date>`
   — consumers with monitoring see it; consumers without monitoring can be found in your logs.
4. **Publish the migration:** old → new mapping, with an example; note what changes (name, type,
   semantics) and what doesn't.
5. **Keep serving during the window.** Nothing is removed while real usage remains. Monitor usage
   (per-consumer where possible); reach out to the long tail before the date.
6. **Remove only after the sunset date**, with evidence of (near-)zero meaningful usage — and
   announce the removal in the changelog. A removal with an active caller is an incident, not a
   release.

## Field-level deprecation

- Mark in the spec schema; responses may keep the field (with the new one added) or move it behind
  `expand=legacy_fields` — document which.
- Webhook payloads: announce event-schema changes with the same protocol; consumers run on their own
  clock.

## Rules

- Never deprecate without a successor; never set a sunset date you can't defend; never remove early
  "because it's been long enough" without the usage evidence.
- Deprecation is not deletion. The window is the feature.
- Record every deprecation in the changelog and the API.md vocabulary list.

## Exit criteria

- Successor shipped, spec/changelog/headers announcing the sunset, migration guide published,
  removal scheduled with a monitoring plan.
