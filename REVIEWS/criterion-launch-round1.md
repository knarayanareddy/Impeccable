# Review: criterion launch artifacts — Round 1

**Panel:** Extension Architect (MV3) · Live-Tooling Engineer · Platform Specialist (iOS/Android) ·
QA Evasion Engineer · Launch/Growth Reviewer.

## Extension Architect — browser extension

| # | Sev | Finding |
|---|---|---|
| E1 | **Major** | The scanner walks only the top document — same-origin iframes (embeds, preview panes) go unscanned. Add a recursive same-origin iframe pass; cross-origin stays out (documented). |
| E2 | **Minor** | `img-no-lazy` marks the first image as `info` on the assumption it's the LCP candidate — that's a heuristic, not a fact. Document it in the README rather than implying certainty. |
| E3 | **Pass** | MV3 shape is correct: activeTab + scripting, no host_permissions, files-injection + function call — the clean pattern. |

## Live-Tooling Engineer — decision-page daemon

| # | Sev | Finding |
|---|---|---|
| L1 | **Minor** | Re-choosing overwrites the result file — document "last choice wins; the agent consumes once" so a re-pick doesn't race a finished `--wait`. |
| L2 | **Minor** | Serves on 0.0.0.0 — fine for local dev, but document that the URL should only be shared on a trusted network (it's a decision page, not an API). |
| L3 | **Pass** | Heartbeat, unknown-option rejection, `--wait`/`--result`/timeout protocol — the reference's decision-page concept, simplified honestly. |

## Platform Specialist — native variants

| # | Sev | Finding |
|---|---|---|
| N1 | **Pass** | VoiceOver/TalkBack specifics, size classes over pixels, dynamic-type extremes, per-platform conformance — correct and current. The one-file-variant routing matches the reference's convention. |

## QA Evasion Engineer — behavioral evals

| # | Sev | Finding |
|---|---|---|
| Q1 | **Major** | The harness pins only `check.mjs` behaviors. The daemon protocol is code too — pin it: serve→choose→wait flow, unknown-option 400, `--wait` timeout. Scenarios should fail if the protocol regresses. |
| Q2 | **Minor** | Add an HTML `<!-- -->` comment scenario — the new comment-stripper's HTML branch is untested. |
| Q3 | **Pass** | 17 scenarios, exit-code semantics, --json shape, severity mapping — the harness itself was already corrected once by running it; that's the mechanism working. |

## Launch/Growth Reviewer — docs, demo, case study

| # | Sev | Finding |
|---|---|---|
| G1 | **Major** | `demos/criterion/before.html` references `chart.png`, which doesn't exist — a broken image in the flagship demo. Replace with an inline SVG placeholder. |
| G2 | **Major** | The root README doesn't link the docs site, demo, or case study — the artifacts are invisible from the entry point. Add a Docs & demo section. |
| G3 | **Minor** | Docs pages lack a license/footer line. |
| G4 | **Pass** | The case study's numbers match the real checker run post-fix (5 errors / 14 warnings) — evidence-first is the right tone. |

## Verdict (Round 1)

Accept E1, E2, L1, L2, Q1, Q2, G1, G2, G3. Reject none.
