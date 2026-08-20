# Command: live

Visual variant mode: pick elements in the browser and generate alternatives. Iteration in the
medium the user sees, not in the diff. Two modes: the **daemon** (decision page, preferred) and
**prompt-based** (fallback).

## Mode 1 — daemon (decision page)

The zero-dependency daemon serves a decision page, records the pick, and lets the agent wait for
it — the browser-native flow:

1. Generate 2–3 variants per element batch — the changed region only, never whole-page rewrites:
   density, hierarchy, color emphasis, or layout alternatives that serve the same job. Write each
   as an option file:

   ```json
   { "name": "A — denser rows", "rationale": "more rows above the fold",
     "css": ".rows { padding: 8px; font-size: 13px; }" }
   ```
   (`html` may replace `css` for a full snippet preview.)

2. Serve and wait in one protocol:
   ```bash
   node <skill-dir>/scripts/live.mjs --round density --port 8765 --options a.json b.json &
   node <skill-dir>/scripts/live.mjs --round density --wait --timeout 600
   ```
   The user opens `http://localhost:8765`, picks a variant; `--wait` prints the recorded choice
   (`{ round, chosen, at, options }`). Re-check with `--result` any time.

3. Apply the pick in one batch; re-screenshot. Record the choice so the final state can be
   rebuilt from the brief.

## Mode 2 — prompt-based fallback

If no browser/server is available, present the same 2–3 variants as descriptions + CSS snippets
in the conversation and ask the user to pick. Same protocol, still frames instead of a live page.

## Prerequisite & rules

- Every variant passes the craft floor before presentation: contrast pairs verified, focus
  visible, targets ≥44px, reduced motion respected (`reference/craft-floor.md`). A bold variant
  that fails the floor is not a variant — it's a bug with a mood.
- Variants preserve behavior, content, and register; live iterates the visual layer only.
- Stop after one confirm round unless the user asks to continue — live mode is iteration with a
  cadence, not a loop (SKILL.md's bounded verification applies here too).
