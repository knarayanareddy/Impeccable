# Command: live

Visual variant mode: pick elements in the browser and generate alternatives. Iteration in the
medium the user sees, not in the diff.

## Prerequisite

Live mode needs a browser/screenshot tool in the harness. If none is available, fall back to
screenshot-based variants presented in the conversation — same protocol, still frames instead of
a live page.

## Steps

1. Open the target surface at desktop and mobile; screenshot the current state as the baseline
   (keep it in the working notes — it is the before for every after).
2. Present 2–3 variants per element batch — the changed region only, never whole-page rewrites:
   density, hierarchy, color emphasis, or layout alternatives that serve the same job.
3. Each variant states its rationale in one line — the user is choosing between *reasons*, not
   colors.
4. Apply the user's picks in one batch; re-screenshot.
5. Stop after one confirm round unless the user asks to continue — live mode is iteration with a
   cadence, not a loop (SKILL.md's bounded verification applies here too).

## Rules

- Every variant passes the craft floor before presentation: contrast pairs verified, focus
  visible, targets ≥44px, reduced motion respected (`reference/craft-floor.md`). A bold variant
  that fails the floor is not a variant — it's a bug with a mood.
- Variants preserve behavior, content, and register; live iterates the visual layer only.
- Record the picks so the final state can be rebuilt from the brief — a live session without
  notes is a design that evaporates.
