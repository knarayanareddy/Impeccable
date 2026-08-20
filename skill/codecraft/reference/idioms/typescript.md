# Idiom sheet: TypeScript

Loaded alongside `domains/idioms.md` when the project is TypeScript. The native-accent
specifics; the compass is the idioms domain.

## Types (the point of the language)

- `strict: true` is the baseline, not the aspiration; `any` is a defect (`anti-patterns.md`
  V4) — `unknown` + narrowing, or the real type.
- Discriminated unions over enums: `type Status = { kind: "pending" } | { kind: "done" }` —
  exhaustive `switch` narrowing makes illegal states unrepresentable (the enum's numbers are
  noise).
- `readonly` for immutability-by-default (the state domain's preference); `as const` for
  literal widening control.

## Null & optional

- Pick the project's convention and hold it: `strictNullChecks` + explicit `undefined` for
  absent vs `null` for explicit-nothing (`domains/state.md`) — never both meaning the same
  thing.
- Optional chaining for reads, never for writing through (`a?.b = x` is a silent skip).

## Async

- `async`/`await` everywhere; raw `Promise` chains and `.then` pyramids are legacy dialect.
- `Promise.all` for independent work with per-item error decisions; no fire-and-forget
  without a documented swallow (`void p.catch(...)` states the policy).

## Structure & style

- Prefer plain functions + data over class ceremony where the framework allows; classes when
  state + identity is the model.
- Named exports at module boundaries (refactor-friendly); barrel files sparingly.
- `eslint` with `typescript-eslint` recommended + `prettier`; format-on-save; no
  `eslint-disable` without the rule and reason (`quality-floor.md` #10).

## Bans

`any`, `@ts-ignore` without reason, non-exhaustive switches on unions, mixed null/undefined
conventions, raw promises, enums-with-numbers for vocabulary, mutable exported state.
