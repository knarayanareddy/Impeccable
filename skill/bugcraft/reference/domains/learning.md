# Domain: Learning

The last mile of debugging: the bug is fixed when its *class* is closed. The postmortem is not a
ritual — it is the mechanism that converts one bug into a permanent defense.

## The postmortem loop (`postmortem` implements this)

1. **The story** — symptom, cause (the broken assumption), fix, verification — in the bug's own
   evidence terms (`domains/evidence.md`).
2. **The escape question** — why did this reach production (or survive this long)? Which gate,
   test, type, or error message would have caught it *at its birth*? The answer is specific: a
   named boundary without validation, a missing case in the inventory, an error swallowed in
   `handler.ts:142`.
3. **The class fix** — the smallest change that catches the class, not the instance: the
   constraint, the test case, the lint rule, the error-message upgrade. The class fix ships in
   the same cycle as the bug fix (`evidence-floor.md` #10).
4. **The sweep** — what *else* shares the broken assumption? The same boundary, the same
   nullability, the same pattern elsewhere (`evidence-floor.md` Reflexes). The sweep's findings
   become tickets or fixes.
5. **The record** — the postmortem lives where the next engineer looks (tracker, ADR-style
   notes, `document`'s output), searchable by symptom and by class.

## The culture rules

- **Blameless by construction** — the question is "what allowed this", never "who wrote it"
   (`anti-patterns.md` C5). The author is the system's most valuable witness, not its defendant.
- **The bug is feedback, not failure** — every bug names a gap between the system's model and
  reality; the postmortem updates the model.
- **Classes, not instances** — the metric that matters is not "bugs fixed" but "bug classes
  closed": one class fix that kills ten instances is worth ten instance fixes.

## The prevention stack (where class fixes land)

Tests (`testcraft`) · types and constraints (`dbcraft`, `codecraft`) · error quality
(`apicraft`, this skill's errors domain) · gates (`shipcraft`) · telemetry gaps (`obscraft`) ·
boundaries (`seccraft`). The postmortem's class fix picks the cheapest layer that catches the
class.

## Bans (recap)

Postmortems without escape analysis, class fixes deferred, blame-shaped retrospectives,
unsearchable records, instance-fix myopia.
