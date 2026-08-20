# Domain: Structure

How code is organized into files, modules, packages, and layers. Structure is the architecture the
reader feels on day one — before they've read a single function.

## Cohesion and coupling

- **Cohesion:** everything in a module changes for the same reason and talks about the same thing.
  The test: can you name the module with one noun phrase ("payment settlement", "session parsing")?
  If the name needs an "and", split it.
- **Coupling:** modules depend on narrow, stable interfaces — never on each other's internals. Depend
  on abstractions where the dependency direction matters, and only there.

## Dependency direction

- Dependencies point inward: unstable, concrete, I/O-adjacent code at the edges; stable, pure,
  domain logic at the center. Business rules never import UI or database code.
- No cycles. A cycle means two modules are actually one module that hasn't been named yet.
- Layering by *reason to change*, not by technology. "Handlers / Services / Repositories" that each
  change for the same feature are ceremony; a vertical slice that changes for one feature is clarity.

## Files

- One primary responsibility per file; ~600 lines is the point where a file must argue for its life
  (`quality-floor.md` #10).
- A file's public surface should fit on one screen: few exports, each with a clear claim. Many exports
  = a grab-bag module.
- Related tests live where the reader looks first (co-located or mirrored, per the codebase's
  convention).

## Boundaries and seams

- Introduce a boundary where: the change rates differ (stable vs churning), the vocabularies differ
  (domain vs framework), or the lifetime differs (process vs request).
- Don't introduce a boundary "for the future" — speculative seams are the most common premature
  abstraction. Extract the seam when the second consumer arrives (`abstract`).

## Configuration and constants

- Config flows in through one well-typed door (env → config struct → validated); no scattered
  `process.env` reads.
- Constants live with the code that needs them; shared constants live in a module named for the
  domain, not `utils.js`.

## Bans (recap)

God files, cycles, internals-reach-across-modules, `utils`/`helpers`/`common` grab-bags, technology-
mirroring layers, speculative seams, scattered config.
