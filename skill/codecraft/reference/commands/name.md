# Command: name

Rename for clarity against the naming rules (`domains/naming.md` is the authority). Renaming is the
cheapest behavior-preserving edit there is — and the most underused.

## Steps

1. Inventory the names in the target and test each claim: function names vs what they do, variable
   names vs what they hold, type names vs what they model, boolean names vs what they ask.
2. Hunt the four failure classes:
   - **Vague:** `data`, `info`, `tmp`, `result`, `obj`, `thing` in signatures or wide scope.
   - **Lying:** names that drifted after edits (`getUser` that also writes, `isValid` that mutates).
   - **Generic verbs:** `handle`, `process`, `manage`, `doThing` — name the action instead.
   - **Inconsistent:** two names for one concept (or one name for two concepts) across the target.
3. Rename in one batch, smallest change per name: precise verb+noun for functions, nouns for
   variables, predicates for booleans. Keep domain vocabulary; don't invent new words.
4. Update every reference — code, tests, doc comments, and any external strings/keys the name
   leaks into (API fields, log keys, config keys: renaming those is a *contract* change, so flag
   and ask first).
5. Verify: tests/types green, and the diff shows no behavior change — a rename diff should touch
   only identifiers and strings.

## Rules

- One word per concept: if the codebase already calls it `fetch`, you don't introduce `load`
   (`align`).
- A rename that changes an API contract is not a rename — it's a breaking change. Separate it and
  ask.
- Don't rename for taste when the current name passes the tests in `naming.md`. Craft spends its
  budget where readers actually stumble.

## Exit criteria

- Every signature name in the target states its claim; names don't lie; one word per concept.
- Diff contains no logic changes.
