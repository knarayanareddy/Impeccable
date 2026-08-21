# Case study: the generic-AI “fix” → the bugcraft pass

A before/after case study driven by the deterministic checker and the repro-check records
gate — the measured transformation, both directions.

## The before

A typical AI-generated patch for the checkout hang (`demos/bugcraft/before.js`): a
`console.log("here")` marker, an `// hack` with no owner, a cart loader that catches each
per-item query failure and logs-and-drops it, a `total()` that returns `null` from its catch,
a disabled `if (false) { legacyTotals }` block, and a commented-out debug line left in the
crime scene. Nobody can say *why* the hang is gone — the patch made the symptom quieter, not
understood.

The checker's verdict (`node skill/bugcraft/scripts/check.mjs --strict`):

```
ERROR debug-marker           before.js:4   console.log("here")
WARN  uncertainty-marker     before.js:5   // hack: this makes it work
ERROR log-and-swallow        before.js:10  catch { console.log(e) }
WARN  silent-catch-return    before.js:22  catch { return null }
WARN  disabled-code          before.js:26  if (false) {
WARN  commented-out-debug    before.js:30  // console.log(...)

bugcraft: 1 file(s) scanned · 2 error(s), 4 warning(s) · FAILED
```

And the records gate on the tracker as the same pass left it
(`node skill/bugcraft/scripts/repro-check.mjs --bugs before-bugs.yaml`):

```
GAP missing-observed   Bug "CHECKOUT-31" has no observed — the symptom must be recorded
GAP missing-steps      Bug "CHECKOUT-31" has no steps/repro path
GAP missing-root-cause Bug "CHECKOUT-31" is fixed with no root-cause — "it works now"
                       is a hypothesis, not a conclusion (evidence-floor #8)
GAP missing-pin        Bug "CHECKOUT-31" is fixed with no pin — every fix ships a
                       regression test (evidence-floor #5)
GAP missing-instrumentation  Bug "AUTH-12" is cannot-reproduce with no instrumentation
GAP missing-ticket     Bug "AUTH-12" … the honest artifact is the instrumentation +
                       the ticket (repro.md step 5)

repro-check: 12 gap(s) · FAILED
```

The bug was "fixed" at evidence level 0: nothing observed, nothing reproduced, nothing
explained, nothing pinned. Every one of those gaps is where the bug would return.

## The pass

`/bugcraft repro` + `/bugcraft diagnose` + `/bugcraft fix` rewrite the story
(`demos/bugcraft/after.js` + `after-bugs.yaml`):

- **The scene captured**: the symptom recorded (`30s+ with 3 items`), the expected behavior
  stated (`< 2s for any cart size`), the repro path written down, the environment named.
- **The cause found**: the cart loader issued one items query per cart row — the N+1. The
  fix lands where the truth diverges: one batched `IN` query, not a retry wrapper.
- **The evidence cited**: the record claims rung 5 — verified fix — with the repro verified
  before/after and the pin green.
- **The pin shipped**: `tests/checkout.test.js:31` fails on the old code and passes on the
  new, linking the bug id.
- **The class closed**: the honest records for the still-open bug (CART-44, at rung 2) and
  the cannot-reproduce one (AUTH-12, with its instrumentation + ticket) — no blind patches.

Both tools now agree:

```
bugcraft: 1 file(s) scanned · 0 error(s), 0 warning(s) · clean ✓
repro-check: all bug records hold the floor ✓
```

## What the transformation measures

| Signal | Before | After |
|---|---|---|
| Checker errors | 2 (marker, log-and-swallow) | 0 |
| Checker warnings | 4 | 0 |
| Records-gate gaps | 12 | 0 |
| Evidence level of the fixed bug | 0 (“it seems broken”) | 5 (verified fix) |
| Regression pins shipped | 0 | 1 |

## Why the two tools, not one

The checker scans code and tells you *where the debugging slop is* — markers, swallowed
errors, uncertainty, scaffolding. The records gate tells you *whether a bug is a bug and
whether it is closed by evidence* — the quartet, the rung, the closure contract. The checker
runs in the agent loop after every edit; the gate runs in CI over the bug records. And the
bug-review daemon closes the loop with a human: close / flag / n-a per bug, the closure gaps
in red. The 39 pinned behavioral scenarios keep all three honest.

## The lesson

The before patch was not sabotage — it was *helpful noise*. It quieted the symptom and
called it fixed. Bugcraft's job is to make the honest path the boring one: the bug exists
when it reproduces, the fix explains every observation, and the pin makes sure the bug
stays dead.
