# Review: dbcraft (database/schema) — Round 2

**Panel:** Reference Keeper (verification) · Second Domain Principal (Postgres specialist) ·
Adversary (checker red-team) · Practitioner (re-check)

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| R1-1/R1-2 shortcuts + hooks | ✅ | Both added |
| D1-1 RLS | ✅ | constraints.md RLS section (deny-by-default, tenant predicate, BYPASSRLS ban, SET ROLE tests) + harden.md multi-tenancy case |
| D1-2 partitioning | ✅ | indexes.md subsection (measured trigger, pruning plans, PK/unique consequences, 50M rule of thumb) |
| A1-1 mapping ids | ✅ | Actual rule ids named; same-file limitation of fk-without-index stated |
| P1-1 DATA template | ✅ | assets/DATA.example.md shipped |

## Fresh-eyes findings (Second Domain Principal — Postgres specialist)

| # | Sev | Finding |
|---|---|---|
| F2-1 | **Pass** | RLS addition is correct and current (default-deny, SET ROLE testing); no changes. |

## Adversary (checker red-team)

| # | Sev | Finding |
|---|---|---|
| A2-1 | **Major** | `float-for-money` misses Postgres' `FLOAT8`/`FLOAT4` aliases — `balance FLOAT8` and `FLOAT8 balance` both slip through. Add them. |
| A2-2 | **Major** | `delete-without-where` misses the multi-line form — `DELETE FROM users` (WHERE on a following line). Windowed check needed. |
| A2-3 | **Major** | `interpolated-sql` misses Python `.format()` and `%`-formatted SQL — the two most common Python injection shapes. Add both. |
| A2-4 | **Pass** | Block parser survives nesting/`CHECK (...)` multiline probing; `update-without-where` catches the single-line form. |

## Practitioner re-check

| # | Sev | Finding |
|---|---|---|
| P2-1 | **Pass** | Round-1 usability concerns resolved. |

## Verdict (Round 2)

Accept A2-1, A2-2, A2-3. Implement all. After this pass, dbcraft is review-clean.
