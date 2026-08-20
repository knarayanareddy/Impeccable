# Framework sheet: Playwright

Loaded with `domains/e2e.md` when the framework is Playwright (the E2E tier's tool). The
framework-native specifics; the compass domains still hold.

## Structure conventions

- One spec per user journey (`checkout.spec.ts`), `test.describe` per journey, tests named as
  the story (`name`'s pattern — behavior→outcome→context).
- **`data-testid` selectors as the contract** (`domains/e2e.md`'s selector rule): the app
  ships test ids; tests never select by CSS class or fragile text.
- Projects split the cost: a smoke project for PRs (2 min) and a full project for nightly
  (`domains/e2e.md`'s cost budget).

## Determinism APIs (the flake-fighters)

- **Auto-waiting is the framework**: `await expect(locator).toBeVisible()` waits for the state
  — `page.waitForTimeout(n)` is the banned sleep (`anti-patterns.md` F1).
- **`page.clock` (and `clock.install`)** for time; **route interception** (`page.route`) for
  the network seam — the real API never answers in E2E (`domains/fakes.md`, `domains/
  determinism.md`'s external row).
- **Test isolation is built in**: fresh context per test (`test.use({ storageState })` only
  where the journey needs a signed-in start); never depend on another test's data
  (`anti-patterns.md` F5).
- **`fullyParallel`** with `test.describe.configure({ mode: "serial" })` only where the
  journey genuinely is a sequence — serial-by-default is a smell.

## The artifact contract

- `trace: "on-first-retry"` + `video: "retain-on-failure"` + screenshot-on-failure in the
  config — the E2E's failure message is a recording (`domains/e2e.md`).
- Retries: **no retry masks** (`anti-patterns.md` F4) — the trace tells the truth, the
  `flaky` command fixes the cause.

## The bans to enforce in CI

- `waitForTimeout`, `.only`/`.skip` (`test.only`/`test.skip` — the checker flags both),
  un-mocked live network, CSS-class selectors, shared-state dependence, video-less failures.

## Bans

Sleep-waits, live external calls, fragile selectors, retry masks, recording-less failures,
serial-by-default, test-id-less apps.
