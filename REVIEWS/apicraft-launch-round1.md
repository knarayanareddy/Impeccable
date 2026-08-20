# Review: apicraft launch artifacts — Round 1

**Panel:** Contract-Tooling Expert · Live-Tooling Engineer · API-Style Specialist ·
QA Evasion Engineer · Launch/Growth Reviewer.

## Contract-Tooling Expert — contract-diff

| # | Sev | Finding |
|---|---|---|
| C1 | **Major** | `--json` output mixes the breaking findings with the diagnostics correctly, but the **non-json output truncates at the first breaking change in wide terminals** — actually worse: removed-operation for `POST /orders` and `GET /orders/{id}` both fire when a **deprecated-with-successor** exists but deprecation isn't marked (correct) — the real gap: **removed-operation doesn't check whether a successor path exists** (e.g. `/v2/orders`). A removal WITH a successor is a versioning decision, not a silent break — report it as a separate severity (breaking-but-versioned). Minor, but the tool should say it. |
| C2 | **Major** | **Schema references aren't followed** — a property whose type is `$ref: '#/components/schemas/Money'` reports no type; changing Money's internals is invisible. Document this as a known limitation in contract-diff.md and note `--json` output omits ref-following (defer full ref-resolution to a later pass — but the limitation must be stated, not silent). |
| C3 | **Pass** | Deprecated-window exemption, flow-style properties, inline/block lists, exit codes — the hard cases are handled. |

## Live-Tooling Engineer — review daemon

| # | Sev | Finding |
|---|---|---|
| L1 | **Minor** | The page has no **"skip/not-applicable"** verdict — every endpoint needs approve/flag, but a reviewer may want to abstain (the agent should treat N/A as "review later"). Add `n/a` as a third verdict. |
| L2 | **Pass** | Partial-submit rejection, all-verdicts-required, --wait/--result, escaping — protocol-correct. |

## API-Style Specialist — style sheets

| # | Sev | Finding |
|---|---|---|
| S1 | **Minor** | gRPC sheet says "errors map to standard status codes" but doesn't name **gRPC's error-model pairing (status + details)** — one line makes it concrete. |
| S2 | **Pass** | GraphQL batching/N+1, proto reserved-fields, webhook HMAC + replay windows — current and correct. |

## QA Evasion Engineer — behavioral evals

| # | Sev | Finding |
|---|---|---|
| Q1 | **Major** | The **contract-diff scenarios are in the apicraft harness only**, but `run-evals.mjs` claims suite-wide coverage — fine (apicraft owns the tool). The real gap: no scenario pins the **deprecated-in-NEW-spec-only case** (removal without a window must flag). Add it — that's the exact semantic that was confused once already. |
| Q2 | **Pass** | 30 scenarios, severity semantics, ordinary-word exemption, template-literal fix, flow-style detection — harness quality is high. |

## Launch/Growth Reviewer — docs, demo, case study

| # | Sev | Finding |
|---|---|---|
| R1 | **Minor** | The case study's "6 breaking changes" number isn't pinned by the demo runner's output (the runner prints the diff but doesn't assert the count). Add the count to the runner's RESULT line so the case study can't drift from the demo. |
| R2 | **Pass** | Docs links resolve (0 broken), license footers present, README entry point updated. |

## Verdict (Round 1)

Accept C2 (document limitation; defer ref-following), L1, S1, Q1, R1. Reject C1's refactor (the successor heuristic is too speculative for a deterministic tool — the versioning decision belongs to the human; document instead).
