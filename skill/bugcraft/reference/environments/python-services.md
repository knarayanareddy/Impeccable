# Environment sheet: Python services

Loaded with `domains/tooling.md`, `domains/reproduction.md`, `domains/errors.md` when the bug
lives in a Python backend. The domains say *what* the debugging pass must be; this sheet says
*how* to get there with Python's instruments.

## The instruments

| Question | Instrument |
|---|---|
| Where does the path diverge? | **pdb/ipdb breakpoints** at the suspected boundary — step the truth, don't print it (`domains/tooling.md`) |
| What did the exception actually say? | The **full traceback + exception chaining** (`raise … from …`) — a re-raised error without `from` deletes the original cause (`domains/errors.md`: errors are written for the next debugger) |
| Where did it hang (not crash)? | `faulthandler` (dump the stack on timeout/signal) + the profiler — "stuck" and "slow" are different bugs |
| What state was in the process? | **Structured, leveled logging** with request context (obscraft's logs domain); the `repr` of the failing object, not a paraphrase |
| Is it a data bug? | The **minimal data case**: the exact row/input that fails, shrunk (`minimize`) — plus the schema's expectation (`dbcraft`'s contract) |
| Heisenbug / race? | Determinism first: seed the randomness, fake the clock (`freezegun`-style), single-thread the concurrency (`commands/repro.md` step 3) |
| Which commit broke it? | `git bisect` with the failing test as the predicate (`domains/bisection.md`) |

## The workflow

1. **Capture the scene**: the traceback, the request, the data — copied verbatim before any
   edit (`domains/evidence.md`: observations are holy).
2. **Reproduce as a script**: a failing pytest or a `repro.py` that hits the same path with
   the same data — one command for the next engineer.
3. **Diagnose by falsification**: one hypothesis, one prediction, the cheapest test that
   kills it (`diagnose`) — and the weird detail is the clue.
4. **Fix at the divergence**: the bad assumption, the missed boundary, the unmodeled state —
   smallest change that explains every observation (`domains/fixes.md`).
5. **Pin it**: a regression test with the exact failing input, failing on the old code and
   passing on the new; the bug id in the test name (`pin`).

## The bans to enforce

- `except: pass` / `except: print(e)` / `except: return None` — each deletes the error before
  anyone reads it (S1-S3, the checker's python rules).
- Catching `Exception` and re-raising without `from` — the cause chain is evidence; preserve it.
- Print-debugging shipped: `print("here")`-family, commented-out debug lines
  (`evidence-floor.md` #7).
- Blind fixes on unreproducible failures — instrument, capture, wait; never patch without a
  repro (`evidence-floor.md` #1).
- "Works now" without the explanation — green after a change proves the change did something;
  the *why* is the fix (#8).
