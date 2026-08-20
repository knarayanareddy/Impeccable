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
| **[`dbcraft`](skill/dbcraft/SKILL.md)** | Database & schema (SQL + ORM-managed) | *Data outlives code. The schema is the longest-lived interface in the system.* |
| **[`testcraft`](skill/testcraft/SKILL.md)** | Testing (unit, integration, E2E) | *Tests are executable specifications. Confidence, not numbers.* |
| **[`perfcraft`](skill/perfcraft/SKILL.md)** | Performance (web, backend, data, delivery) | *Measure before you optimize. The user's clock is the only clock.* |
| **[`seccraft`](skill/seccraft/SKILL.md)** | Security (threat modeling, authn/authz, injection, secrets) | *Security is the design of failure, not a final scan. Trust is explicit.* |

### seccraft — the Impeccable of security

- **14 commands** — a shared vocabulary: `threatmodel` (signature: trust boundaries → threats →
  tickets), `authz` (fix the IDOR class), `sanitize`, `secrets`, `lock`, `harden`, `depend`,
  `monitor`, `respond`, `audit`, `review`, `measure`…
- **8 domain references** — **trust** (the differentiator: boundaries, least privilege, fail
  closed), authn, authz, injection, secrets, crypto, data, abuse
- **A security floor** — every input untrusted, object-level authz everywhere, default-deny,
  boring current crypto, secrets managed
- **20 security-slop anti-patterns** — hardcoded credentials, authn-without-authz, `alg: none`
  JWTs, innerHTML-with-data, demo defaults, MD5-for-passwords… each with the fix
- **A deterministic checker** — `scripts/check.mjs`: hardcoded credentials (redacted), private
  keys, interpolated SQL, insecure hashes, weak JWTs, eval/Function/document.write, XSS sinks,
  command injection, Math.random tokens, http URLs, permissive CORS, auth-disabled routes,
  insecure cookies, stack traces in responses — zero dependencies, no LLM, no API key

### perfcraft — the Impeccable of performance

- **15 commands** — a shared vocabulary: `profile`, `benchmark`, `optimize`, `cache`, `defer`,
  `parallelize`, `budget`, `harden`, `monitor`, `prune`, `audit`, `review`, `measure`…
- **8 domain references** — measurement (the differentiator: percentiles, methodology, flame-graph
  attribution), web, latency, caching, concurrency, data, memory, delivery
- **A perf floor** — every optimization has a number, percentiles not averages, budgets in CI,
  correctness survives optimization
- **20 perf-slop anti-patterns** — optimization theater, N+1s, sync I/O, benchmark theater,
  cache-everything, vendor bloat, retry storms… each with the fix
- **A deterministic checker** — `scripts/check.mjs`: N+1 patterns, sync I/O, `SELECT *`, unbounded
  loads, busy retry loops, layout/DOM thrash, deep clones, string-concat loops, images > 1MB,
  missing budget gates — zero dependencies, no LLM, no API key

### testcraft — the Impeccable of testing

- **14 commands** — a shared vocabulary: `shape`, `scaffold`, `flaky`, `strengthen`, `isolate`,
  `speedup`, `harden`, `cover`, `prune`, `name`, `audit`, `review`, `measure`…
- **8 domain references** — cases, units, fakes, integration, e2e, assertions, determinism,
  coverage
- **A suite floor** — every test asserts a contract, deterministic by construction, no sleeps,
  no focused tests merged, behavior over implementation
- **20 test-slop anti-patterns** — `.only` left in, skipping accumulating, empty tests,
  tautological assertions, sleep-as-sync, retry masks, coverage theater… each with the fix
- **A deterministic checker** — `scripts/check.mjs`: focused/skipped tests, empty tests (incl.
  `def test_x(): pass`), tautological assertions, sleeps, unseeded randomness, retry masks,
  network calls in tests, files with tests but no assertions — zero dependencies, no LLM, no API key

### dbcraft — the Impeccable of database/schema design

- **14 commands** — a shared vocabulary: `migrate`, `constrain`, `normalize`, `index`, `denormalize`,
  `harden`, `audit`, `review`, `measure`, `modernize`…
- **8 domain references** — types, constraints, keys, relationships, normalization, indexes,
  migrations, queries
- **A schema floor** — every table keyed, every rule in the schema, migrations safe + reversible,
  hot queries index-backed
- **20 schema-slop anti-patterns** — nullable-everything, VARCHAR(255) sprawl, floats for money,
  EAV, JSON-as-schema, destructive migrations, SELECT *, WHERE-less deletes… each with the fix
- **A deterministic checker** — `scripts/check.mjs` with CREATE TABLE block parsing: missing PKs,
  nullable columns, FKs without ON DELETE or indexes, float money, tz-less timestamps, interpolated
  SQL, dynamic DDL, destructive DDL — zero dependencies, no LLM, no API key

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
npx skills add knarayanareddy/Impeccable --skill dbcraft
npx skills add knarayanareddy/Impeccable --skill testcraft
npx skills add knarayanareddy/Impeccable --skill perfcraft
npx skills add knarayanareddy/Impeccable --skill seccraft

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
/dbcraft constrain .             # add the constraints the schema is missing
/dbcraft migrate                 # write safe, reversible, tested migrations
/testcraft flaky .               # hunt and fix flaky tests — root cause, never retries
/testcraft strengthen src/cart   # weak assertions → contract-pinning assertions
/perfcraft profile src/checkout  # measure where time actually goes (flame graph/trace)
/perfcraft budget .              # performance budgets as code + CI regression gates
/seccraft threatmodel orders     # trust boundaries → threats → tickets
/seccraft authz src/api          # object-level authorization: fix the IDOR class
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
| **Database & schema** | ✅ **shipped as `dbcraft`** | Nullable-everything, no constraints, floats for money, destructive migrations — schema floor + checker |
| **Testing** | ✅ **shipped as `testcraft`** | `.only` left in, sleeps, tautological asserts, retry masks — suite floor + checker |
| **Performance** | ✅ **shipped as `perfcraft`** | Optimize-without-measuring, N+1s, benchmark theater — perf floor + checker |
| **Security** | ✅ **shipped as `seccraft`** | Complements tool-based scanners: trust-model judgment, authn-vs-authz, secure defaults — floor + checker |
| **Observability** | planned | Logs that lie, metrics without meaning — what to record and why |
| **DevOps / CI-CD** | planned | Pipeline slop: unreviewable workflows, deploy fear — the craft of shipping |
| **Debugging** | planned | Print-debugging, shotgun fixes — root-cause discipline (`repro`, `bisect`, `hypothesis`) |

See [`RESEARCH.md`](RESEARCH.md) for the full market research: why Impeccable trended, the
engineering-skill landscape, and the white-space analysis behind this suite.

## License

Apache-2.0. Original work — not affiliated with pbakaus/impeccable.
