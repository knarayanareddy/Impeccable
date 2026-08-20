# Impeccable — craft skills for AI coding agents

A collection of **craft skills** that make AI coding agents (and the humans driving them) produce
work with expert judgment instead of defaults. Each skill packages one facet of building software the
way [Impeccable](https://github.com/pbakaus/impeccable) packaged UI design: **a shared command
vocabulary + domain reference knowledge + explicit anti-pattern bans + a deterministic checker +
one-line install.**

> The thesis: AI agents are great at *doing* things and mediocre at *judging quality* — in design, in
> code, in data, in APIs. Skills fix that by changing the agent's baseline, before the output is
> generated, and by making quality measurable instead of vibes.

## The skills

| Skill | Facet | The POV |
|---|---|---|
| **[`criterion`](skill/criterion/SKILL.md)** | Data-dense UI/UX (dashboards, tools, forms, tables) | *Design for the second hour, not the first impression. Measure, don't vibe.* |
| **[`codecraft`](skill/codecraft/SKILL.md)** | Code quality & maintainability (any language) | *Code is read ten times more than it is written. Simplify or justify.* |
| **[`apicraft`](skill/apicraft/SKILL.md)** | API design (REST, GraphQL, gRPC, webhooks) | *An API is a promise, not an endpoint. Judge from the consumer's code.* |

### apicraft — the Impeccable of API design

- **14 commands** — a shared vocabulary: `contract`, `review`, `audit`, `paginate`, `rename`,
  `version`, `deprecate`, `harden`, `measure`…
- **8 domain references** — resources, HTTP semantics, errors, payloads, pagination, idempotency,
  versioning, specs (contract-first)
- **A contract floor** — every endpoint in the spec, one error envelope, bounded collections,
  retry-safe mutations, compatibility sacred
- **20 API-slop anti-patterns** — verbs in URLs, 200-with-error, success wrappers, leaked
  internals, unbounded pagination, ambiguous dates… each with the fix
- **A deterministic checker** — `scripts/check.mjs`: verbs in URLs, GET side effects, deep nesting,
  hardcoded credentials (redacted), `SELECT *`, missing Retry-After, mixed casing, missing spec
  file — zero dependencies, no LLM, no API key

### codecraft — the Impeccable of code quality

- **15 commands** — a shared vocabulary: `review`, `simplify`, `flatten`, `name`, `dedupe`,
  `abstract`, `harden`, `measure`, `audit`…
- **8 domain references** — naming, functions, structure, comments, errors, complexity,
  duplication, idioms
- **A quality floor** — 30-line functions, depth ≤ 3, no boolean flags, no swallowed errors,
  behavior sacred
- **20 code-slop anti-patterns** — the tells of un-reviewed code, each with the fix
- **A deterministic checker** — `scripts/check.mjs`: magic numbers, swallowed exceptions, debug
  statements, `any`, suppressions, loose equality, commented-out code, deep nesting, god files,
  TODO sprawl — zero dependencies, no LLM, no API key

### criterion — the Impeccable of product UI

- **18 commands** — `audit`, `densify`, `measure`, `benchmark`, `polish`, `harden`…
- **8 domain references** — incl. data-display (tables/charts/dashboards), the differentiator
- **A numeric craft floor** — contrast ≥ 4.5:1, 4px grid, 44px targets, tabular figures, 5 states
- **A deterministic checker** — `scripts/check.mjs`: banned fonts, purple→blue gradients, pure
  black, elastic easing, oversized radius, `transition: all`…

## Quick start

```bash
# From your project root — auto-detects your agent (Claude Code, Cursor, Codex, …)
npx skills add knarayanareddy/Impeccable --skill codecraft
npx skills add knarayanareddy/Impeccable --skill criterion
npx skills add knarayanareddy/Impeccable --skill apicraft

# Claude Code (plugin marketplace)
/plugin marketplace add knarayanareddy/Impeccable
```

Then, in your AI coding tool:

```
/codecraft review src/api        # readability review with scoring
/codecraft simplify src/payment  # reduce complexity, preserve behavior
/criterion densify dashboard     # more information per viewport, less clutter
/apicraft contract orders        # write the machine-readable contract (spec-first)
/apicraft audit .                # API defect scan + deterministic checker
```

Manual install: copy a skill folder (`skill/codecraft/`, `skill/criterion/`) into your agent's
skills directory (`.claude/skills/`, `.cursor/skills/`, `.agents/skills/`, `.gemini/skills/`, …).

## The pattern (how each skill is built)

```
skill/<name>/
├── SKILL.md              # persona · principles · command table · routing · verification loop
├── scripts/check.mjs     # deterministic anti-pattern checker (zero deps, exit codes, --json)
└── reference/
    ├── quality-floor.md  # the non-negotiable floor, loaded before every edit
    ├── anti-patterns.md  # the "slop tells", each with the fix, mapped to checker rules
    ├── domains/          # the deep knowledge (8 per skill)
    └── commands/         # one playbook per command
```

## Roadmap — the other facets

Same pattern, next domains. Each is a facet of building software where agents today ship defaults
instead of judgment:

| Facet | Status | The anti-slop thesis |
|---|---|---|
| **API design** (REST/GraphQL/RPC) | ✅ **shipped as `apicraft`** | Endpoints that lie, pagination that breaks, errors that leak — contract-first + deterministic checker |
| **Database & schema** | planned | Nullable-everything, no constraints, EAV, stringly IDs — schema review + checker |
| **Testing** | planned | Tests that test implementation, sleeps, no assertions — test-craft vocabulary |
| **Performance** | planned | Optimize-without-measuring, N+1s, jank — profile-first discipline |
| **Security** | planned | Complements tool-based scanners: authn/authz judgment, threat-model habits |
| **Observability** | planned | Logs that lie, metrics without meaning — what to record and why |
| **DevOps / CI-CD** | planned | Pipeline slop: unreviewable workflows, deploy fear — the craft of shipping |
| **Debugging** | planned | Print-debugging, shotgun fixes — root-cause discipline (`repro`, `bisect`, `hypothesis`) |

See [`RESEARCH.md`](RESEARCH.md) for the full market research: why Impeccable trended, the
engineering-skill landscape, and the white-space analysis behind this suite.

## License

Apache-2.0. Original work — not affiliated with pbakaus/impeccable.
