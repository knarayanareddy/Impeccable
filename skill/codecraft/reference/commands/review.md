# Command: review

Readability and maintainability review with scoring — the judgment pass that `audit`'s defect scan
can't do. Structured subjectivity. No code edits.

## Scorecard (1–5 each)

| Dimension | The question |
|---|---|
| Readability | Can a reader reconstruct the intent at reading speed, without notes? |
| Naming | Do the names make their claims precisely, and keep them (`naming.md`)? |
| Shape | Are functions one job, small, flat, well-parameterized (`functions.md`)? |
| Structure | Are modules cohesive, boundaries clean, dependencies pointed inward (`structure.md`)? |
| Errors | Is every failure path visible and handled per the model (`errors.md`)? |
| Comments | Do comments carry only *why* — and are they true (`comments.md`)? |
| Idiom | Does it read native to the language and the codebase (`idioms.md`)? |
| Consistency | Does it match its neighbors — or justify every deviation? |
| Testability | Can the tricky parts be tested in isolation, or are they welded to I/O? |
| Simplifiability | What's the smallest change that would delete the most complexity? |

## Steps

1. Read the target top to bottom once, as the next reader would — no notes yet. Then re-read with
   the scorecard.
2. For every score below 4, name the exact line and the reader question it fails to answer.
3. Deliver: the scorecard table, the three highest-leverage fixes (ranked by how often the code is
   read), one honest strength, and one "bold move" — the single change that would most elevate the
   code.

## Rules

- Review the code, not the author; praise is specific or omitted ("clean" with no evidence is noise).
- Review in the codebase's own standard — a Go file is judged as Go, a React hook as React
  (`idioms.md`).
- No edits in review. If the user wants the fixes, follow-up commands (`simplify`, `flatten`,
  `name`...) pick up the ranked list.
