# Review: shipcraft (DevOps/CI-CD) — Round 2

**Panel:** Reference Keeper (verification) · Second Domain Principal (GitHub Actions
specialist) · Adversary (checker red-team) · Practitioner (re-check)

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| R1-1/R1-2 shortcuts + hooks | ✅ | Both added |
| R1-3 workflow example | ✅ | assets/workflow.example.yml (stage order, concurrency groups, lockfile discipline, digest pins, referenced secrets, rollback job) referenced from pipeline.md |
| D1-1 branch protection | ✅ | gates.md: branch protection as the platform-level baseline gate |
| D1-2 12-factor | ✅ | config.md names 12-factor's config tenet |
| A1-1 mapping ids | ✅ | Rule ids named with escape hatches documented |
| P1-1 SHIP template | ✅ | assets/SHIP.example.md shipped |

## Fresh-eyes findings (Second Domain Principal — GitHub Actions specialist)

| # | Sev | Finding |
|---|---|---|
| F2-1 | **Pass** | The example workflow already includes concurrency groups with cancel-in-progress — current standard. No changes. |

## Adversary (checker red-team)

| # | Sev | Finding |
|---|---|---|
| A2-1 | **Major** | `masked-failure` misses **`set +e`** — the whole-script error-trap disabler, the mask that hides all masks. Add it. |
| A2-2 | **Major** | `pipe-to-shell` misses the **curl-to-file-then-execute** form (`curl -o install.sh URL && bash install.sh`) — same supply-chain door. Add. |
| A2-3 | **Major** | `latest-tag` misses **untagged images** (`image: app` with no tag at all) — no tag *is* latest. Add. |
| A2-4 | **Pass** | Secret echoes, force flags, destructive ops, retries-on-tests, deploy-without-rollback, missing-lockfile survive probing. |

## Practitioner re-check

| # | Sev | Finding |
|---|---|---|
| P2-1 | **Pass** | Round-1 usability concerns resolved. |

## Verdict (Round 2)

Accept A2-1, A2-2, A2-3. Implement all. After this pass, shipcraft is review-clean.
