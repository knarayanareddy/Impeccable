# Case study: the generic AI code → the codecraft pass

A before/after case study driven by the deterministic checker — the same artifact strategy as
the criterion case study, applied to code quality.

## The before

A typical AI-generated checkout helper (`demos/codecraft/before.js`): a god function with vague
parameter names (`data`, `tmp`, `isForce`), magic numbers 47 and 42, four levels of nesting,
loose equality (`isForce == true`), a swallowed `catch (e) { }`, a shipped `console.log`,
commented-out dead code, five owner-less TODOs, and `var` in modern JavaScript.

The checker's verdict (`node skill/codecraft/scripts/check.mjs --strict demos/codecraft/before.js`):

```
ERROR swallowed-error    before.js:15  catch {}
ERROR debug-statement    before.js:16  console.log(
WARN  legacy-var         before.js:5   var userName
WARN  vague-name         before.js:7   parameter "tmp"
WARN  magic-number       before.js:10  47 · before.js:14  42
WARN  loose-equality     before.js:11  == / !=
WARN  commented-out-code before.js:12  return data.items[0];
WARN  deep-nesting       before.js:13  ≥5 levels
WARN  vague-name         before.js:29  function handle
WARN  todo-sprawl        before.js:1   6 markers

codecraft: 1 file(s) scanned · 2 error(s), 10 warning(s) · FAILED
```

Every tell is a named violation with a rule id and a fix.

## The pass

One codecraft pass — `simplify` (replace the flags with guard clauses), `name` (state the
claims: `MAX_ITEMS`, `ITEM_MULTIPLIER`, `toPoints`), `flatten` (depth 5 → 2), `harden` (errors
travel with context), `document` (constants carry their reasons, TODOs their owners), `align`
(modern syntax) — produces `demos/codecraft/after.js`: the same behavior, expressed as
claims, with every floor item measurable.

```
codecraft: 1 file(s) scanned · 0 error(s), 0 warning(s) · clean ✓
```

## The claim

The transformation is verifiable in both directions. The checker rejects the before and passes
the after — code quality with a receipt, not a vibe.
