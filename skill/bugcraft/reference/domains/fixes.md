# Domain: Fixes

The fix is where diagnosis becomes code. The rule: **the fix lands where the truth diverges, it
is as small as the cause, and it proves itself against the repro.**

## The minimal-fix discipline (`fix` implements this)

1. **Name the broken assumption.** The cause in one sentence: "we assumed emails are unique"
   ("domains/diagnosis.md"'s root-cause definition). If the cause can't be stated as an
   assumption, it isn't understood yet — back to diagnosis.
2. **Fix the assumption, not its symptoms.** The symptom is the crash, the null, the wrong
   total; the assumption is upstream. Fixing the assumption often makes several symptoms
   disappear at once — the class fix (`evidence-floor.md` #10).
3. **One change.** The fix is one commit-sized change that tests the hypothesis. Two fixes are
   two bugs or an un-understood cause (`evidence-floor.md` #2).
4. **Verify against the repro** — fails before, passes after (`evidence-floor.md` #1), then run
   the suite (the fix's blast radius is the regression's candidate space).
5. **Pin it** — the regression test in the same change (`pin`): the exact input, the expected
   behavior, the bug link.

## Root cause vs symptom (the test)

Ask: *if I had fixed this and only this, would the bug class die?* A fix that patches the null
check but leaves the null's origin alive is a symptom fix — the next null arrives from the next
caller. The root-cause fix changes the *origin* (validate at the boundary, make the state
unrepresentable — `dbcraft`'s constraints domain is the deep end of this).

## The honesty rules

- **Revert cleanly when wrong.** A fix that doesn't verify against the repro reverts — the
  attempt is recorded, the branch is not the graveyard (`evidence-floor.md` #3).
- **The fix's size is the understanding's size.** A 300-line fix for a one-line bug means the
  cause isn't found — shrink the repro, not the codebase (`evidence-floor.md` Reflexes).
- **Fast-and-wrong is not fixed.** The fix must keep the suite green *and* the pin green —
  trading a bug for a failing test is a bug swap, not a fix.
- **State what was NOT changed.** The fix's blast boundary is named: adjacent behavior,
  adjacent inputs — explicitly untouched (`evidence-floor.md` #2's twin).

## The fix family

- **Boundary fix** — validate/normalize where input crosses the trust line (`seccraft`'s
  injection domain is the authority).
- **State fix** — the missing state or transition, modeled (`dbcraft`'s "booleans grow into
  enums").
- **Contract fix** — the code and the caller disagree about the promise; fix the code or the
  contract, never both silently (`apicraft`'s contract-first doctrine).
- **Rollback fix** — the change that broke it, reverted — with the pin so it can't return
  (`shipcraft`'s recovery domain).

## Bans (recap)

Symptom patches, multi-bug single fixes, unverified fixes, size-disproportionate fixes,
blast boundaries unstated, pins omitted.
