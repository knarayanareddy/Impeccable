# Command: harden

Production-readiness for the target: the five states, error handling, edge cases, and i18n. This is
where shipped tools die if skipped.

## Steps

1. Enumerate every data region and form in the target (from `shape`'s state list or fresh inspection).
2. For each, implement or verify the five states (craft-floor.md #7):
   - **Empty** — with a next action (domains/ux-writing.md).
   - **Loading** — layout-preserving skeleton or real progress (domains/motion.md).
   - **Error** — what/why/how-to-fix, next to the cause, with retry where retry makes sense.
   - **Overflow** — long strings truncated-with-identity, many rows paginated/sorted, narrow widths
     collapsing per the adapt strategy.
   - **Permission-denied** — what's hidden and what to ask for.
3. Edge cases, systematically: extremes (longest name, largest number, negative, zero, null, undefined),
   concurrent edits, double-submit, offline/failed requests, timezones (dates across TZ boundaries),
   very old/new data, special characters and RTL strings, empty user/team.
4. i18n: extract strings (no concatenation, proper plurals, no baked images/text); date/number/currency
   formatting through locale-aware APIs; verify layout at 200% and RTL mirror.
5. Failure behavior: every async action has a timeout, an error path, and a retry; destructive actions
   have confirmation proportional to cost (domains/interaction.md).

## Exit criteria

- Five states present on every region; each state copy passes the ux-writing format.
- A written edge-case sweep with every case triaged (handled / accepted-with-reason / deferred).
- No unhandled promise/fetch path in the touched code.

## Rules

- Harden adds states and guards; it doesn't redesign or add features.
- Never hide an error by swallowing it; a visible, actionable error beats a silent retry.
- If the target already ships some states, verify them rather than rebuilding them.
