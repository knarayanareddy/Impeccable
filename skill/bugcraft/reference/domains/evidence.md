# Domain: Evidence

Evidence is the entire discipline of debugging — everything else is machinery for gathering it.
The differentiator domain: **every claim carries its evidence level, and conclusions only outrank
their evidence when they're wrong.**

## The evidence ladder (claim your rung)

| Level | The claim | What it proves |
|---|---|---|
| 0 | "It seems slow / broken / weird" | Nothing yet — a direction to look |
| 1 | Observation — the error, the log, the screenshot | Something real happened, once |
| 2 | Reproduction — it fails on demand | The bug exists, and is in scope |
| 3 | Minimal repro — the smallest failing case | The cause is nearly named |
| 4 | Confirmed hypothesis — the prediction came true | The cause is understood |
| 5 | Verified fix — repro fails before, passes after, pin green | The bug is dead, provably |

## The rules of evidence

- **Never climb without a rung.** A fix at level 1 is a guess with a commit (`evidence-floor.md`
  #1). Each command in this skill exists to move the claim up one rung.
- **Cite the rung.** "The cause is X (level 3: minimal repro fails only with empty input)" — the
  honest label is the craft. An unlabeled claim is a bluff.
- **Observations are holy.** Record the exact error, the exact input, the exact state before
  touching anything — debugging that starts by altering the scene destroys the evidence.
- **The anomaly is the clue.** When observations contradict a theory, the theory loses — the
  observation doesn't. The weird detail is the crack where the real cause is hiding
  (`evidence-floor.md` Reflexes).
- **"Works now" is level 0 with a green suit.** After a change, green proves the change did
  something; the *explanation* is what earns level 5.

## The evidence chain in practice

Every debugging session can be read as a chain: observation → reproduction → minimal repro →
confirmed hypothesis → verified fix → regression pin → class closed. Each link names its
evidence; a chain with a weak link is where the bug will return.

## Bans (recap)

Fixes at level 1, unlabeled claims, edited-before-recorded observations, theories that outrank
their evidence, "works now" as a conclusion.
