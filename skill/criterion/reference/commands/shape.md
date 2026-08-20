# Command: shape

Plan the UX, IA, and data flow before writing code. Shape owns task discovery; visual-world decisions
escalate to `new-work`.

## Steps

1. Restate the feature as a **job statement**: "A [role] can [task] so that [outcome]." If it cannot be
   stated this way, ask for the missing piece — do not invent it.
2. Inventory the data: entities, fields, types, statuses, extremes (longest string, most rows, smallest
   screen, empty set). Reuse the schema from PRODUCT.md when present.
3. List the states this feature needs: empty, loading, error, overflow, permission-denied, plus any
   domain states (in-progress, expired, ...). Enumerate them now — retrofitting is how half of tool-UI
   defects are born.
4. Choose the register (Command/Configure/Record/Convince) and density tier per surface.
5. ASCII-wireframe the layout: regions, data flow, and the job-per-viewport statement (see new-work.md
   step 3).
6. Write the acceptance checklist: what must be visible above the fold, the keyboard path, the touch
   path, and the measurable floor items from craft-floor.md.
7. Only if the feature needs a new visual world or a new surface concept, hand off to
   `reference/new-work.md`; otherwise present the plan and wait for approval before coding.

## Deliverable

A short plan: job statement → data inventory → state list → register + density → wireframe →
acceptance checklist. No code in shape output.
