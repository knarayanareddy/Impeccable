# Command: init

Capture the API's context and conventions so every later command reads the same facts. One-time setup
per API (or per team).

## Steps

1. Inspect, don't interrogate. Read the existing routes/controllers, the spec (if any), the client
   SDKs or consuming code, and the docs. Extract the facts.
2. Ask the user only what the code can't answer:
   - Audience: internal / partner / public? (Public = every decision is permanent.)
   - Style: REST / GraphQL / gRPC / webhooks — one primary style.
   - Consumers' ecosystems (JS? Python? mobile?) — drives casing and SDK priorities.
   - Compatibility policy: how long is N-1 supported? Deprecation window?
3. Write `API.md` at the project root (or `.apicraft/API.md` if the root is crowded) — start from the template `assets/API.example.md`:
   - Audience and style
   - Conventions: field casing, date format, error envelope, pagination style, ID strategy
   - Vocabulary: domain terms and their canonical field/path names (frozen list)
   - Versioning & deprecation policy, compatibility window
   - Security model: authn/authz scheme, rate limits
   - The spec file's location and the CI spec-diff setup (add one if missing)
4. End with the recommended next step: usually `contract` (spec-first), `audit` for an existing API,
   or `shape` for a new resource.

## Rules

- Facts only — API.md is shared memory, not an essay. Keep it <80 lines.
- Never ask what the code or spec already answers; never re-ask across sessions.
- No API edits during init. This command captures context.
