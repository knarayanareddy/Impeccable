# Command: live

Refactor variant mode: present two behavior-preserving craft fixes side by side and let the
user pick — iteration on *code*, in the medium the user reads. The code-facet adaptation of
the decision-page pattern; bounded rounds, same as every other command.

The daemon is a per-skill copy of the decision-page pattern: each skill ships its own
(`scripts/live.mjs`) so a standalone install (`npx skills add --skill codecraft`) carries the
whole feature — the protocol is shared by design, the file is local by design.

## The protocol (daemon)

1. Write the two variants as option files — each names the move and shows the result:

   ```json
   { "name": "A — guard clauses", "rationale": "depth 5 → 2, behavior preserved",
     "code": "function ship(order) {\n  if (!order) return;\n  if (!order.is_paid()) return;\n  ...\n}" }
   ```

2. Serve and wait:

   ```bash
   node <skill-dir>/scripts/live.mjs --round simplify --port 8765 --options a.json b.json &
   node <skill-dir>/scripts/live.mjs --round simplify --wait --timeout 600
   ```

   The user opens the decision page, reads both diffs, picks; `--wait` prints the recorded
   choice. Last choice wins; consume once.

3. Apply the pick in one batch; run the behavior tests (the contract is preserved by
   construction — live presents only behavior-preserving variants) and the checker.

## Rules

- Variants are refactors, never behavior changes — each option states its contract
  (`quality-floor.md` #1) and the user picks between *reads*, not semantics.
- One confirm round per live pass; the pick is recorded so the final state can be rebuilt.
- Trusted network only; the daemon binds 0.0.0.0 for preview/tunnel use and serves a decision
  page, not an API.
