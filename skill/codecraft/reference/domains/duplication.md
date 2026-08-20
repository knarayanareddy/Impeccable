# Domain: Duplication

Duplication is a question, not a bug: *do these two pieces of code change together, for the same
reason?* The answer decides everything.

## The rules

- **Rule of three.** First occurrence: write it. Second: note it. Third: extract — and now you have
  three real examples to shape the abstraction against, instead of guessing from two.
- **Same reason to change** is the only valid trigger for abstraction. Two functions that look
  identical but serve different features will diverge — abstracting them creates the *wrong*
  abstraction, which costs more than the duplication ever did.
- **AHA programming** (avoid hasty abstractions): prefer duplication over the wrong abstraction until
  the pattern is undeniable.

## What duplication actually is

- **Mechanical duplication** — same block, same reason → extract a function.
- **Structural duplication** — different bodies, same shape (validation, mapping, retry) → extract a
  *pattern* (a wrapper, a helper, a generic), not the body.
- **Knowledge duplication** — the same rule re-expressed in two places (`isAdult` implemented as
  `age >= 18` in three files) → single source of truth. This is the only duplication that's always a
  defect, because one of the copies *will* drift.
- **Interface duplication** — parallel types that mirror each other → derive one from the other.

## What duplication is not

- Two similar-looking functions with different change reasons (the billing tax and the shipping tax
  look alike today; they will not change together).
- Similar test code that encodes the same intent *independently* (tests are documentation; clever
  shared test helpers are how wrong-abstraction bugs get blessed).

## Extraction mechanics (`dedupe`)

1. Identify the invariant core and the varying edges.
2. Name the abstraction by its job, not its shape (`formatCurrency`, not `processNumber`).
3. Parameterize the edges — but no boolean flags (`functions.md`).
4. Re-run the three call sites; if one needs a special case that doesn't fit, you extracted the
   wrong slice — back up one step.
5. Delete the copies; leave one test that pins the shared behavior.

## Bans (recap)

Copy-paste with tweaks, knowledge expressed twice, the wrong abstraction (divergent twins unified),
`utils` grab-bags that hide unrelated helpers, DRY-ing test code into unreadability.
