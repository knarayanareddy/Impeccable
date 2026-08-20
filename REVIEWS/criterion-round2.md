# Review: criterion (UI/UX) — Round 2

**Panel:** Reference Keeper (verification) · Second Domain Principal (accessibility specialist) ·
Adversary (checker red-team) · Practitioner (re-check)

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| R1-1 `live` | ✅ | Added as Iterate command with bounded rounds and a no-browser fallback |
| R1-2 `document` | ✅ | Added as Build command; reads incumbent truth, writes DESIGN.md |
| R1-3 pin shortcuts | ✅ | Routing note with `.claude/commands/` example |
| R1-4 native scope | ✅ | Recorded in Scope notes (deliberate web-first decision) |
| R1-6 hooks | ✅ | Setup step 5 + shared `docs/hooks.md` (PostToolUse/CI wiring) |
| D1-1 `quieter` | ✅ | Added with the noise-reduction order; `bolder` omission justified in Scope notes |
| D1-2 small multiples | ✅ | Added to data-display.md charts rules |
| A1-1 mapping ids | ✅ | Detector mapping now names actual rule ids |
| P1-1 DESIGN template | ✅ | `assets/DESIGN.example.md` shipped |

## Fresh-eyes findings (Second Domain Principal — accessibility)

| # | Sev | Finding |
|---|---|---|
| F2-1 | **Minor** | `live` variants have no floor constraint — a "bold" variant could ship sub-threshold contrast. Add: variants must pass craft-floor (contrast, focus, reduced motion). |
| F2-2 | **Minor** | `document` records colors/type/spacing but not the a11y state (focus styles, reduced-motion support, label wiring). Add one extraction line. |
| F2-3 | **Minor** | `init` writes PRODUCT.md too, but only DESIGN has a template. Add `assets/PRODUCT.example.md`. |

## Adversary (checker red-team)

| # | Sev | Finding |
|---|---|---|
| A2-1 | **Minor** | `pure-black` false-positives on `box-shadow: 0 1px 2px #000` — a black shadow is legitimate; the rule targets surfaces/text. Add a shadow-context exemption. |
| A2-2 | **Minor** | `radius-too-large` flags `rounded-full` on avatars/icons — legitimate; the ban targets data-dense containers. Add an avatar/icon-context exemption. |
| A2-3 | **Pass** | `slow-feedback`, `transition-all`, `elastic-easing`, `gray-on-color` (chroma-aware) survive red-team attempts. |

## Practitioner re-check

| # | Sev | Finding |
|---|---|---|
| P2-1 | **Pass** | Round-1 usability concerns resolved; command table reads complete. |

## Verdict (Round 2)

Accept F2-1, F2-2, F2-3, A2-1, A2-2. Implement all. After this pass, criterion is review-clean
with no open findings above Minor.
