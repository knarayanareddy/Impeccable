# Command: clarify

Improve UX copy: labels, buttons, errors, empty states, and microcopy (domains/ux-writing.md is the
authority). For interfaces that work but read like they were written by the database.

## Steps

1. Extract every user-facing string in the target into a table: location | current | role (label /
   button / state / helper).
2. Rewrite against the rules:
   - Name things by what the user controls, not internals ("Notifications", not "Webhook config").
   - Buttons state the action ("Save changes", not "Submit"); same action, same name app-wide.
   - Errors: what happened → why → how to fix; next to the cause; no apologies, no blame, no vagueness.
   - Empty states: what this view is + what's here normally + the next action as a real button.
   - Numbers/dates/units: one format per surface, units in headers, timezones where they matter.
   - Kill exclamation marks and emoji in Command/Configure copy; kill "Supercharge your workflow".
3. Preserve meaning — clarify rewrites wording, never invents facts or promises. If the copy claims
   something the product doesn't do, flag it instead of fixing it silently.
4. Check consistency across the target: same concept → same word, everywhere (one word for one thing).

## Exit criteria

- Every string in the target either passes the role rules or is flagged as needing product input.
- One-word-one-meaning holds across the surface.

## Rules

- Clarify does not add copy where the UI doesn't need it — sometimes the fix is deleting a sentence.
- i18n strings stay extraction-friendly: no concatenation, no idioms, proper plurals.
