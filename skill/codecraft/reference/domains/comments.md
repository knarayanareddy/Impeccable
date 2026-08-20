# Domain: Comments

Comments explain what the code cannot: **why**. Every comment is a promise the code keeps, or it's
noise — there is no third category.

## The only four comments worth writing

1. **Rationale** — why this approach and not the obvious one: "SHA-256, not MD5: upstream requires it
   for signature verification."
2. **Invariants and contracts** — what must be true at entry/exit, what the caller owes the function:
   "caller must hold the write lock; returns a slice that shares the buffer."
3. **Tradeoffs and gotchas** — "O(n²) on purpose: n ≤ 50 and this avoids an allocation."
4. **Landmarks** — one-line section markers in genuinely large files, as a map, not a diary.

Anything else — "increment the counter", "the constructor", "loop over items" — is a lie waiting to
happen and trains readers to skip comments. Delete it (`document`).

## Comment hygiene

- Comments live next to the code they explain; a comment separated from its subject rots first.
- Update or delete on every edit — comment rot is worse than no comment because it is *believed*.
- Comments are prose: sentences, punctuation, no ASCII art, no changelogs in the header (git has the
  history), no author/date stamps (git has those too).
- Never comment out code to "keep it just in case" — git remembers, the file must not
  (`anti-patterns.md` C2).

## Doc comments

- Public APIs get doc comments stating the contract: what it does, what it expects (and validates),
  what it returns, what it throws/returns-as-error, and any lifetime/threading notes. The contract,
  not the algorithm.
- Parameters and returns documented only when the name doesn't already carry it. `@param name the
  name` is noise.
- Examples in doc comments only when the example teaches a non-obvious usage — otherwise they decay.

## TODOs

A TODO is a promise with three required parts: what remains, why it can't be done now, and who/when
will do it — an issue reference or an owner. More than a handful in one file means the design is
unfinished, not the code (`anti-patterns.md` C5). Treat TODO sprawl as a design defect, not a
to-do list.

## Bans (recap)

What-comments, commented-out blocks, header changelogs, author stamps, unowned TODOs, comments that
lie.
