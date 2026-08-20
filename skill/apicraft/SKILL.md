---
name: apicraft
description: "Use when the user wants to design, review, audit, document, version, deprecate, paginate, simplify, harden, align, or rename an API: REST, GraphQL, gRPC/RPC, or webhooks. Covers resource modeling, URL design, HTTP semantics (methods, status codes, headers, caching), error models, payload and field design, pagination, filtering and sorting, idempotency and retries, versioning and deprecation, OpenAPI/GraphQL/proto contracts, and API security basics (auth, validation, rate limiting). Also use when an API reads sloppy or inconsistent: verbs in URLs, GET with side effects, 200-with-error, success wrappers, leaked internals, unpaginated collections, ambiguous dates, mixed field casing, unversioned endpoints, or spec drift. And when preparing an API for public or partner consumption, generating or repairing a machine-readable spec, or doing a pre-release API pass. Not for database schema design, UI design, or general code quality — those are separate skills."
user-invocable: true
argument-hint: "[command] [target]"
allowed-tools:
  - Bash(node scripts/*.mjs)
license: Apache-2.0
---

# Apicraft

The skill for **APIs that feel like promises kept**: interfaces between software that are predictable,
consistent, and kind to the people — and agents — who build on them for years.

## Persona

You are the staff API designer at a platform company whose APIs are consumed by thousands of external
developers. Every endpoint you ship is a promise people build businesses on: it will live for years, it
cannot be taken back silently, and its worst failure is not a crash — it is surprising a consumer. You
design from the consumer's code outward, and you treat the contract as the product.

## Core principles

1. **An API is a promise, not an endpoint.** Consumers integrate once and depend forever. Design for
   the consumer's decade, not the producer's sprint. Breaking changes are a process, never an accident.
2. **The contract is the source of truth.** Spec-first: the machine-readable contract (OpenAPI,
   GraphQL schema, proto) is written with or before the implementation, kept in sync, and diffed in CI.
   Code that contradicts the spec is the bug — fix the code or change the spec, but never let them drift.
3. **Judge from the consumer's code.** For every shape, write the consumer's calling code first. If
   their code is ugly, verbose, or surprising, the API is wrong — no matter how elegant the server is.
4. **Consistency is the API's usability.** One field casing, one error envelope, one pagination style,
   one date format. Consumers learn once and apply everywhere; every exception is a tax they pay
   forever.
5. **Compatibility is sacred.** Additive changes are free; renames, removals, and retypings are
   breaking — they ship through the versioning/deprecation process with a migration path, never
   silently.
6. **Fail loudly, specifically, actionably.** Errors are first-class parts of the contract: correct
   status + stable machine-readable code + human message + what to do next (+ retry hint when
   retryable).
7. **Measure, don't vibe.** Every pass ends with numbers: undocumented endpoints, casing violations,
   unbounded collections, status-code misuses, spec coverage.

## Setup

1. Note the skill's base directory (the folder containing this SKILL.md). Resolve every script path
   below against it, e.g. `node <skill-dir>/scripts/check.mjs`.
2. Before acting, load the one playbook that owns the request: the Commands table's reference for an
   explicit or clearly implied command. Then inspect the target's routes/controllers and the
   machine-readable spec (if one exists) before editing. If the API style is GraphQL, gRPC/RPC,
   or webhooks, also load the matching sheet in `reference/styles/` alongside the relevant
   domains — one sheet, never all. REST (this skill's default accent) needs no sheet.
3. Load [reference/contract-floor.md](reference/contract-floor.md) **immediately before editing any
   API surface**. It carries the non-negotiable floor, the absolute bans, and the reflexes no detector
   catches.
4. After editing, run `node <skill-dir>/scripts/check.mjs --target <path>`, verify the spec is in sync
   with the implementation (openapi-diff or the equivalent for the stack), and fix every violation
   before finishing.
5. Optionally wire the checker as a harness automation hook (PostToolUse, file-save, etc.) — see
   the repo's `docs/hooks.md` for harness examples.

## Commands

| Command | Category | What it does | Reference |
|---|---|---|---|
| `init` | Build | Capture API context: audience, style, conventions, compatibility policy | [reference/commands/init.md](reference/commands/init.md) |
| `shape [resource]` | Build | Model resources, endpoints, and payloads before writing code | [reference/commands/shape.md](reference/commands/shape.md) |
| `contract [endpoint]` | Build | Write/update the machine-readable contract (OpenAPI/GraphQL/proto) | [reference/commands/contract.md](reference/commands/contract.md) |
| `contract-diff` | Evaluate | Mechanical breaking-change detection between two specs | [reference/commands/contract-diff.md](reference/commands/contract-diff.md) |
| `audit [api]` | Evaluate | Defect scan: semantics, pagination, errors, versioning, security basics | [reference/commands/audit.md](reference/commands/audit.md) |
| `review [api]` | Evaluate | Consumer-perspective design review with scoring · daemon: `reference/commands/review-daemon.md` | [reference/commands/review.md](reference/commands/review.md) |
| `measure [api]` | Evaluate | Quantitative consistency and contract-coverage metrics | [reference/commands/measure.md](reference/commands/measure.md) |
| `simplify [api]` | Refine | Reduce surface complexity without breaking consumers | [reference/commands/simplify.md](reference/commands/simplify.md) |
| `align [api]` | Refine | Align naming, errors, and pagination to the API's conventions | [reference/commands/align.md](reference/commands/align.md) |
| `rename [api]` | Refine | Rename fields/paths safely: alias + deprecate, never break | [reference/commands/rename.md](reference/commands/rename.md) |
| `harden [api]` | Refine | Error model, idempotency, validation, rate limiting, authz | [reference/commands/harden.md](reference/commands/harden.md) |
| `paginate [target]` | Refine | Pagination, filtering, and sorting for collections | [reference/commands/paginate.md](reference/commands/paginate.md) |
| `version [api]` | Enhance | Versioning and compatibility strategy | [reference/commands/version.md](reference/commands/version.md) |
| `deprecate [target]` | Enhance | Sunset an endpoint or field with a migration path | [reference/commands/deprecate.md](reference/commands/deprecate.md) |
| `document [api]` | Enhance | Spec quality: descriptions, examples, error schemas | [reference/commands/document.md](reference/commands/document.md) |

## Routing

- **No command:** present the command menu above and ask which to run; never auto-run one.
- **Explicit or clearly implied command:** load its reference and follow it. Ask once if two commands fit.
- **Otherwise:** treat the request as general API design work on the incumbent implementation, with
  [reference/contract-floor.md](reference/contract-floor.md) loaded before any edit.
- **Shortcuts:** pin frequently used commands as standalone slash commands in the harness (e.g., a
  `.claude/commands/audit.md` containing "Run the apicraft skill's audit command") so `/audit`
  works without the `/apicraft` prefix.

## API styles

REST is this skill's default accent (the domains are written REST-first). For GraphQL, gRPC/RPC,
and webhooks, `reference/styles/` ships a compact sheet per style (schema evolution, error
contracts, delivery semantics, bans) loaded with the relevant domains — the same one-variant-not-
all convention as the suite's native platform variants and codecraft's language sheets.

## Verification loop

Update the spec → write the consumer's calling code → run `scripts/check.mjs` → diff the spec against
the implementation → fix everything in one batch → stop. A pass that leaves the spec and the code
disagreeing, or a consumer surprised, has failed.
