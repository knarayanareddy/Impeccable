# Review: bugcraft (debugging) — Round 2

**Panel:** Reference Keeper (verification) · Second Domain Principal (debugger-tooling
specialist) · Adversary (checker red-team) · Practitioner (re-check)

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| R1-1/R1-2 shortcuts + hooks | ✅ | Both added |
| D1-1 record/replay | ✅ | Tooling table: rr/WinDbg TTD/browser replay for heisenbugs |
| A1-1 mapping ids | ✅ | Rule ids named with escape hatches documented |
| P1-1 DEBUG template | ✅ | assets/DEBUG.example.md shipped |

## Fresh-eyes findings (Second Domain Principal — debugger-tooling specialist)

| # | Sev | Finding |
|---|---|---|
| F2-1 | **Pass** | Record/replay addition is current; bisect.md's new `git bisect run` automation line is exactly right. No changes. |

## Adversary (checker red-team)

| # | Sev | Finding |
|---|---|---|
| A2-1 | **Major** | `uncertainty-marker` only matches comment *lines* — misses inline trailing comments (`x = y * 2; // hack`) where the doubt actually lives. Extend to inline comments. |
| A2-2 | **Major** | `disabled-code` misses C-style `if (0) {` blocks. Add. |
| A2-3 | **Pass** | Windowed empty/comment-only/return catches survive probing (empty `catch {}` bodies across lines are correctly caught as comment-only swallows). |
| A2-4 | **Pass** | "here"-family debug markers, commented-out debug, silent returns survive probing. |

## Practitioner re-check

| # | Sev | Finding |
|---|---|---|
| P2-1 | **Pass** | Round-1 usability concerns resolved. |

## Verdict (Round 2)

Accept A2-1, A2-2. Implement all. After this pass, bugcraft is review-clean — and the entire
suite has completed both review rounds.
