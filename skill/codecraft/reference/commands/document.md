# Command: document

Make comments carry only *why* (`domains/comments.md` is the authority). The goal is not more
comments — it's fewer, better ones.

## Steps

1. Read the target once as the next reader and collect the four questions the code doesn't answer:
   what does this do (unclear intent), why does it exist, what must be true here, what happens on
   failure.
2. Edit per the rules:
   - **Delete** what-comments ("increment i"), stale comments, and any commented-out code — the
     file is not a museum.
   - **Replace** how-comments with names: a comment explaining a block usually means the block
     wants extraction and a name (`extract`).
   - **Keep/write only the four kinds:** rationale, invariants/contracts, tradeoffs/gotchas,
     landmarks — in prose, next to the code they explain.
3. Doc comments on public APIs: state the contract (behavior, validation, returns, errors,
   lifetime), not the algorithm; document parameters only when the name doesn't already carry it.
4. TODOs: give each an owner/issue and a concrete trigger — or delete it. TODO sprawl is a design
   defect (`comments.md`), so flag it as one.
5. Verify: no comment in the target explains what the code says; every remaining comment answers a
   reader question.

## Rules

- A documentation pass that only *adds* text has failed. The exit condition is usually a net
  deletion.
- Never document to hide complexity — if the comment would need three paragraphs, simplify instead
  (`simplify`) and keep one line of why.
- Comments are code: they get reviewed, updated on every edit, and deleted when they stop being
  true.
