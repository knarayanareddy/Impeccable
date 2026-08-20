# Domain: Errors

Errors are the system's testimony — the first input every debugger gets, and the first thing
sloppy code destroys. Two crafts live here: *reading* errors well, and *writing* errors that
deserve reading.

## Reading errors (the debugger's side)

- **The stack trace is a narrative** — read the frames top to bottom: the top names *where*, the
  frames between name *how it got there*, and the first frame of your code names *your
  assumption*. Never patch at the top frame without reading down.
- **The error code is vocabulary** — the code (not the prose message) is the contract to match
  and search (`apicraft`'s errors domain is the authority). Two errors with the same code are
  the same class; different codes, different suspects.
- **The message's specificity is the clue** — "cannot parse '01/13/2026' as date" names the
  input and the parser; "an error occurred" names nothing (`evidence-floor.md` Reflexes). Chase
  the specific.
- **Logs bracket the truth** — the lines before the error are the scene; the lines after are
  the aftermath. Structured logs with correlation IDs let you walk one request's whole story
  (`obscraft`'s logs domain).

## Writing errors (the craft that feeds the next debugger)

- **Operation + subject + cause + fix** — "save order #102: payment declined (card_expired);
  retry with a valid card" (`evidence-floor.md` #9). The message is written for the engineer
  who has never seen this code.
- **Context is wrapped, never stripped** — each layer adds its operation to the chain
  (`fmt.Errorf("load config: %w", err)`-style); a bare rethrow deletes the journey.
- **Codes are stable and documented** — the class the debugger matches on; never reuse a code
  for a new meaning.
- **Errors travel, not vanish** (`anti-patterns.md` S1–S3): handled, translated, or propagated
  — a swallowed error is testimony destroyed.

## The error-quality audit (`audit` walks this)

For the target's error paths: is every failure visible? does every message carry operation +
subject + cause? are the codes stable? would the 3 a.m. engineer find the cause from the error
alone — or open the code (`obscraft`'s 3 a.m. test, applied to errors)?

## Bans (recap)

Swallowed errors, log-and-swallow, silent catch returns, bare rethrows, codes without meaning,
messages that name nothing.
