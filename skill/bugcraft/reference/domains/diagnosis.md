# Domain: Diagnosis

Diagnosis is hypothesis-driven elimination — the discipline that turns poking into a process.
The rule: **one hypothesis, one prediction, one observation** — and the cheapest falsification
first.

## The hypothesis loop (`diagnose` implements this)

1. **Enumerate** — list the candidate causes, from the observations, *including* the boring ones
   ("the input was empty", "the config didn't load"). The boring hypothesis is right more often
   than the clever one.
2. **Rank by falsification cost** — each hypothesis makes a falsifiable prediction ("if it's the
   cache, clearing it changes nothing else"). Test the cheapest prediction that kills the most
   candidates first.
3. **Test one at a time** — one change, one observation, recorded. The log of attempts is the
   diagnosis's audit trail (`evidence-floor.md` #2).
4. **Eliminate, don't confirm** — you're removing suspects, not building a case. A hypothesis
   survives only while its predictions hold; the first failed prediction acquits it.
5. **The winner explains everything** — the surviving hypothesis accounts for the headline
   symptom *and* the weird details (`evidence-floor.md` #3). A cause that explains only the
   headline is a suspect with a good lawyer.

## The mental toolkit

- **Differential diagnosis** — what distinguishes the candidates? Find the observation that only
  one candidate predicts, and test it.
- **The 5-whys, honestly** — "why" chains are for finding the *assumption* that broke, not the
  person who made it. Root cause = the fixable assumption ("we assumed emails are unique").
- **The changed-thing heuristic** — bugs cluster around recent change: the last deploy, the last
  migration, the last config edit. Check the diff before the deep theory (`shipcraft`'s deploy
  log answers "what changed?" — use it).
- **Chesterton's fence** — before removing the weird code, understand why it exists; the bug is
  often the fence's reason, not the fence.

## The failure modes

- Confirmation bias (`anti-patterns.md` D1): the favorite theory gets evidence, rivals get
  excuses. Fix: each hypothesis's prediction written *before* the test.
- Theory-lock: refusing to abandon a hypothesis the evidence has acquitted. Fix: the log of
  attempts — the evidence, not the ego, decides.
- Premature convergence: fixing at the first explanation that fits, skipping the weird detail.
  Fix: the "explains everything" gate (`evidence-floor.md` #3).

## Bans (recap)

Untested theories shipped as fixes, unfalsifiable hypotheses, shotgun multi-changes, the
favorite-suspect bias, fixing at the first fit.
