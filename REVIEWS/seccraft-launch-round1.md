# Review: seccraft launch artifacts — Round 1

**Panel:** Lock/Gate Expert · Threat-Tooling Engineer · Surface Specialist ·
QA Evasion Engineer · Launch/Growth Reviewer.

## Lock/Gate Expert — lock-check.mjs

| # | Sev | Finding |
|---|---|---|
| L1 | **Major** | The gate can't see **what it didn't check**: a config with no `cookies` key at all gets the same cookie gaps as one with `secure: false` — correct — but a config where the *adapter didn't map anything* (empty `{}`) is indistinguishable from one that maps a fully-locked surface. Same class as budget-check's unmeasured honesty: report **"config maps no areas"** when `headers`/`cookies`/`cors`/`tls` are all absent — the adapter may be the gap, not the config. |
| L2 | **Pass** | Gap list, exit codes, --json, the CORS-wildcard-with-credentials pair — correct. |

## Threat-Tooling Engineer — threat-review daemon

| # | Sev | Finding |
|---|---|---|
| T1 | **Minor** | The "no control stated" callout is good, but the verdict menu lacks **"defer"** — a threat that belongs to another component's model. Add it (the honest routing verdict). |
| T2 | **Pass** | Protocol parity, escaping, all-verdicts-required. |

## Surface Specialist — surface sheets

| # | Sev | Finding |
|---|---|---|
| S1 | **Minor** | The sheets aren't referenced from **`threatmodel`/`harden`** (the recurring wiring class). One line each. |
| S2 | **Pass** | Web/API/mobile content is current: CSP+SRI, BOLA-as-#1, cert pinning, Keystore/Keychain, runtime-only secrets. |

## QA Evasion Engineer — behavioral evals

| # | Sev | Finding |
|---|---|---|
| Q1 | **Minor** | No scenario pins the **dotenv-comment** behavior (`.env` lines starting with `#` are comments — the new stripper's yaml/env branch). Add one. |
| Q2 | **Pass** | 24 scenarios; the harness already caught the ternary-chain bug and the template-port false positive — the mechanism is working. |

## Launch/Growth Reviewer — docs, demo, case study

| # | Sev | Finding |
|---|---|---|
| R1 | **Pass** | Demo shows all four gates; case study numbers match; docs resolve; README updated. |

## Verdict (Round 1)

Accept L1, T1, S1, Q1. Reject none.
