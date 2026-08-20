# Command: pin

The regression test: the exact input that broke, pinned forever (`domains/fixes.md` #5 is the
authority; `testcraft`'s domains are the test-craft playbook). The only proof a bug can't return.

## Steps

1. Take the minimal repro (`minimize`'s artifact) and the fix (`fix`'s change).
2. Write the test from the repro, not from the fix:
   - The exact failing input (the minimal case, verbatim).
   - The expected behavior — the *contract*, stated from the spec or the domain, never from the
     fixed code's output (that's circular: the test would bless the fix forever).
   - A comment linking the bug id — the test is the bug's gravestone, and the link is the
     headstone's inscription.
3. Place the test at the level that pins the behavior (`testcraft`'s cases domain): unit for
   logic, integration for seams. Name it per `testcraft`'s naming: behavior → outcome → context.
4. Verify the pin honestly: fails on the old code (checkout the pre-fix commit if possible),
   passes on the new. A pin that never saw red hasn't proven it can bite.
5. Sweep for siblings (`domains/learning.md`): the same assumption elsewhere gets its own case —
   the class pin, not just the instance pin.

## Exit criteria

- The pin fails on old, passes on new, links the bug, names the contract; the sibling sweep
  recorded.

## Rules

- The expected value is written by hand, from the contract — never copied from the fixed code
  (`testcraft`'s assertions domain agrees).
- The pin tests behavior, not the implementation — it must survive refactors
  (`testcraft`'s units domain).
- A fix without a pin is a bug on parole (`fix`'s exit criteria) — pin ships with fix, always.
