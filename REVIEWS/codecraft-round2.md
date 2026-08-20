# Review: codecraft (code quality) — Round 2

**Panel:** Reference Keeper (verification) · Second Domain Principal (functional-programming
lead) · Adversary (checker red-team) · Practitioner (re-check)

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| R1-1 pin shortcuts | ✅ | Routing note added |
| R1-2 hooks | ✅ | Setup step 5 + shared docs/hooks.md |
| R1-3 tunable floor | ✅ | `.codecraft/config.json` mechanism + example asset + init/floor wiring |
| D1-1 state domain | ✅ | `domains/state.md` added (immutability, absence, mutation scope, state machines, globals) and wired from floor + errors |
| D1-2 cognitive complexity | ✅ | SonarSource metric cited with the >15 threshold in complexity.md |
| A1-1 vague-name scope | ✅ | Detector mapping now states the signature-only limitation |
| P1-1/P1-2 templates | ✅ | CODEBASE.example.md + codecraft.config.example.json shipped |

## Fresh-eyes findings (Second Domain Principal — FP lead)

| # | Sev | Finding |
|---|---|---|
| F2-1 | **Pass** | state.md's "derived beats stored", "narrow the null's lifetime", and "state machines over flags" are exactly the FP-correct positions — no changes. |
| F2-2 | **Minor** | state.md should cross-reference **tests for transitions** (the state machine's forbidden transitions get pinned in tests). One line, pointing at testcraft's cases domain. |

## Adversary (checker red-team)

| # | Sev | Finding |
|---|---|---|
| A2-1 | **Major** | `swallowed-error` misses **comment-only catch bodies**: `catch (e) { /* TODO handle later */ }` and the multiline form — the most common real-world swallow. Add both forms. |
| A2-2 | **Major** | `silent-catch-return` misses **bare `return;` swallows** in JS: `catch (e) { return; }` — returns `undefined` without rethrow. Add it. |
| A2-3 | **Pass** | `console.error` in legitimate error handlers correctly NOT flagged (only log/debug/info/trace); `!==`/`===` correctly not flagged; magic-number whitelist survives boundary probing. |

## Practitioner re-check

| # | Sev | Finding |
|---|---|---|
| P2-1 | **Pass** | Round-1 usability concerns resolved; tunable floor matches how real teams set policy. |

## Verdict (Round 2)

Accept A2-1, A2-2, F2-2. Implement all. After this pass, codecraft is review-clean.
