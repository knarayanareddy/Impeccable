# Idiom sheet: Python

Loaded alongside `domains/idioms.md` when the project is Python. The native-accent specifics;
the compass is the idioms domain.

## Naming & types

- `snake_case` for everything but classes (`PascalCase`) and constants (`UPPER_SNAKE`) —
  PEP 8 is the law, `ruff format`/`black` enforce it.
- Type hints on public signatures (modern, checked): `def load(path: Path) -> Config | None`
  — the 3.10+ union syntax, `Optional` only where the floor is older.
- `dataclasses` for data carriers (frozen where immutability is the point —
  `domains/state.md`), not dicts-as-objects.

## Errors & boundaries

- Exceptions for exceptional conditions; catch the specific type, never bare `except`
  (`anti-patterns.md` E4 — the checker flags `except: pass` and its windowed forms).
- Re-raise with context: `raise TransformError("process", cause=e) from e` — the cause chain
  is Python's built-in error journey (`domains/errors.md` #E2).
- Validate at the boundary (`pydantic`-style where the stack uses it); return values stay
  predictable inside the trusted core.

## Standard library first

- `pathlib` over string path surgery; `datetime` with explicit timezone over epoch ints
  (UTC inside, localize at the edge — `dbcraft`'s types domain agrees).
- Context managers (`with`) for every resource; f-strings over `%`/`.format()`; 
  comprehensions over loops where the result is the collection — and plain loops where
  clarity wins.

## Structure & style

- Imports: stdlib → third-party → local, sorted by `ruff`/`isort`; no circular imports
  (a cycle is two modules wearing one name — `domains/structure.md`).
- Dependencies pinned via `uv.lock`/`requirements` (lockfile discipline — shipcraft's
  builds domain); a venv per project, no global installs.

## Bans

Bare `except`, cause-less re-raises, `mutable` default arguments, dicts-as-objects, tz-naive
datetime in logic, print-debugging shipped (`bugcraft`'s debug-marker class), stringly
error matching.
