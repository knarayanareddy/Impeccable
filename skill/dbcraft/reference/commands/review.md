# Command: review

Schema design review with scoring — the judgment pass `audit`'s defect scan can't do: would this
schema still be *right* in ten years? No edits.

## Scorecard (1–5 each)

| Dimension | The question |
|---|---|
| Truthfulness | Does the schema say what is true — types, constraints, uniqueness (`constraints.md`)? |
| Modeling | Are the entities and cardinalities right (`relationships.md`)? |
| Keys | Are identity decisions deliberate and stable (`keys.md`)? |
| Normalization | Is each fact stored once, with deliberate exceptions (`normalization.md`)? |
| Types | Money, time, text, state — decided, not defaulted (`types.md`)? |
| Indexing | Are hot queries index-backed and indexes named for their queries (`indexes.md`)? |
| Migration discipline | Safe, reversible, versioned history (`migrations.md`)? |
| Query craft | Parameterized, set-based, bounded (`queries.md`)? |
| Naming & consistency | One convention, one name per concept? |
| Evolution fitness | Can the schema absorb the next five features without surgery? |

## Steps

1. Read the schema (DDL/migrations/ORM models) top to bottom as the next data engineer would — no
   notes yet. Then re-read with the scorecard.
2. For every score below 4, name the exact table/column and the truth it fails to record or the
   query it will punish.
3. Deliver: the scorecard table, the three highest-leverage fixes (ranked by data-integrity
   impact), one honest strength, and one "bold move" — the single change that would most elevate
   the schema.

## Rules

- Review the schema, not its author; praise is specific or omitted.
- Review in the engine's own idiom (a MySQL schema is judged as MySQL, not as Postgres-wish).
- No edits in review; follow-up commands (`constrain`, `normalize`, `index`, `harden`...) pick up
  the ranked list.
