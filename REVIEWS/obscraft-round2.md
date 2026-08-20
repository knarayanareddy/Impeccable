# Review: obscraft (observability) — Round 2

**Panel:** Reference Keeper (verification) · Second Domain Principal (OpenTelemetry specialist) ·
Adversary (checker red-team) · Practitioner (re-check)

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| R1-1/R1-2 shortcuts + hooks | ✅ | Both added |
| R1-3 semantic conventions | ✅ | metrics.md: OTel conventions for infrastructure-shaped signals + resource attributes; instrument.md wired |
| A1-1 mapping ids | ✅ | Rule ids named (with exemptions documented) |
| P1-1 OBSERVABILITY template | ✅ | assets/OBSERVABILITY.example.md shipped |

## Fresh-eyes findings (Second Domain Principal — OpenTelemetry specialist)

| # | Sev | Finding |
|---|---|---|
| F2-1 | **Pass** | Semantic-conventions addition is correct and current; span naming + resource attributes in place. No changes. |

## Adversary (checker red-team)

| # | Sev | Finding |
|---|---|---|
| A2-1 | **Major** | `secret-in-log` misses the bare `token` field (`logger.info({ token })`) — the most common field name in the wild. Add to the sensitive set (word-boundary, so `tokenId`-style prose stays clean). |
| A2-2 | **Minor** | `log-in-loop` window (2 lines) misses loop bodies where the log sits deeper. Extend to 4. |
| A2-3 | **Major** | `no-correlation-propagation` false-positives on **frontend files** (tsx/jsx that call their own API — the browser's propagation isn't the service's job). Exempt tsx/jsx. |
| A2-4 | **Minor** | `no-slo-file` fires on single-file targeted scans — project scope only (carried from A1-2). |
| A2-5 | **Pass** | Generic errors, string-concat logs, mean-only metrics, scatter ≥3, owner-less alerts, PII redaction escape hatch survive probing. |

## Practitioner re-check

| # | Sev | Finding |
|---|---|---|
| P2-1 | **Pass** | Round-1 usability concerns resolved. |

## Verdict (Round 2)

Accept A2-1, A2-2, A2-3, A2-4. Implement all. After this pass, obscraft is review-clean.
