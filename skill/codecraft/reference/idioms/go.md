# Idiom sheet: Go

Loaded alongside `domains/idioms.md` when the project is Go. The native-accent specifics;
the compass is the idioms domain.

## Naming

- Short names for short scopes (`i` in a 3-line loop, `e` in a 5-line handler); longer names
  only as scope widens — the language's own convention, not sloppiness.
- Initialisms stay case-consistent: `URL`, `ID`, `HTTP` (not `Url`); `json:"snake_case"`
  tags match the wire contract.
- Acronyms in exported names: `ParseURL`, `ServeHTTP` — never `ParseUrl`.

## Errors (the language's spine)

- Errors are values: return `(T, error)` and *handle* the error — never `_ = err` outside a
  comment that says why.
- Wrap with context at every layer boundary: `fmt.Errorf("load config: %w", err)` — a bare
  `return err` deletes the journey (`domains/errors.md` #E2).
- `errors.Is`/`errors.As` for matching; sentinel errors and typed errors over string compares.
- No panics for control flow — panic is for programmer errors that cannot recover.

## Concurrency

- Goroutines are cheap but unbounded: `errgroup` for groups, worker pools with backpressure,
  `context.Context` as the first parameter through every call that may block.
- Channels for communication, not for locks when a mutex is clearer; buffered-channel
  semantics documented (capacity is a contract).

## Structure & style

- One package = one purpose, named for the domain; no `util`/`helpers` grab-bags.
- Interfaces at the *consumer* (small, one-method where possible), implementations at the
  producer — Go's interface direction is deliberate.
- Zero-value useful by default; constructors (`NewThing`) when setup is required.
- `gofmt` is the law; `go vet` + `staticcheck` in CI. `go mod tidy` + committed `go.sum`.

## Bans

`panic`-for-errors, ignored errors, bare rethrows, unbounded goroutines, interface bloat at
the producer, stringly error matching, `interface{}` where generics or a type exist.
