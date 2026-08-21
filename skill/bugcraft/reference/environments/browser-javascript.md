# Environment sheet: Browser JavaScript

Loaded with `domains/tooling.md`, `domains/reproduction.md`, `domains/errors.md` when the bug
lives in the browser. The domains say *what* the debugging pass must be; this sheet says *how*
to get there with the browser's instruments.

## The instruments

| Question | Instrument |
|---|---|
| What did the page actually do? | DevTools: the **Sources panel + breakpoints** (step the truth, don't print it); the **Network panel** with response bodies and timings; the **Console** for uncaught errors with stack + source maps |
| Which line of the original code threw? | **Source maps** wired in the build — a minified stack trace without a map is a puzzle, not testimony (`domains/errors.md`) |
| What state did the user's page have? | **Screenshot/session replay** (Sentry-style breadcrumbs, RRWeb replays) — the scene, recorded before anyone edits it |
| Is it reproducible outside prod? | **A HAR + the repro URL**: record the network exchange, replay it in a local/staging build (`domains/reproduction.md` — the repro is the diagnosis) |
| Which browser/version? | The parity matrix: UA, viewport, feature-detection results — a browser-only repro with the browser named |
| What changed the state? | **Break on attribute/breakpoint on mutation**, event-listener breakpoints — catch the write, not just the symptom |
| Frontend-backend disagreement? | The request/response pair side by side — the API contract is the boundary where truth usually diverges (`apicraft`'s errors domain agrees) |

## The workflow

1. **Capture the scene first**: URL, UA, viewport, console errors, the network exchange —
   before touching anything (observations are holy, `domains/evidence.md`).
2. **Reproduce on demand**: the failing click path encoded as a script or Playwright test —
   one command for the next engineer (`commands/repro.md`).
3. **Shrink it**: strip the page to the smallest DOM + event sequence that still fails
   (`minimize`) — the repro IS the diagnosis.
4. **Fix at the boundary where truth diverges**: the component state, the data shape, the
   event ordering — not the CSS that hides the symptom (`domains/fixes.md`).
5. **Pin it**: the regression test replays the exact failing interaction; the bug link in
   the test name (`pin`).

## The bans to enforce

- `console.log("here")`-style print-debugging as the default instrument — breakpoints inspect
  without editing (`evidence-floor.md` #7).
- Swallowed errors: `catch {}` around event handlers, `.catch(() => {})` on the fetch —
  each deletes the browser's testimony (S1).
- `window.onerror` that reports and drops — the error reporter must propagate or record
  (`domains/errors.md`).
- Minified builds with no source maps shipped to the debugging environment.
- "It works in Chrome" as a fix — the parity matrix, or the hypothesis is still open
  (`evidence-floor.md` #8).
