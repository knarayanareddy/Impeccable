# Command: init

Capture the codebase's conventions and quality policy so every later command reads the same facts.
One-time setup per project.

## Steps

1. Inspect, don't interrogate. Read the entry points, the build/lint config, one or two
   representative files per layer, and the docs (README/CONTRIBUTING/ADRs). Extract the *facts*.
2. Ask the user only what the code can't answer: quality policy (what's non-negotiable here?), the
   team's review culture, known pain points, and any legacy conventions that are frozen.
3. Write `CODEBASE.md` at the project root (or `.codecraft/CODEBASE.md` if the root is crowded) — start from the template `assets/CODEBASE.example.md`:
   - Stack and tooling (language versions, formatter/linter, build, test commands)
   - Conventions: naming, structure, error model, async style, module layout
   - Idioms in use, incl. any that deviate from language defaults
   - The quality floor deltas: local ceilings (function length, file size, coverage policy)
   - Vocabulary: domain terms and their canonical code names
   - Known pain points and areas to preserve ("don't modernize layer X — it's frozen")
4. End with the recommended next step: usually `review` for an unfamiliar codebase, `shape` for a
   change, `audit` if the code already looks sloppy.

## Rules

- Facts only — CODEBASE.md is the shared memory, not an opinion essay. Keep it <80 lines.
- Never ask what the code already answers; never re-ask across sessions.
- No code edits during init. This command captures context.
