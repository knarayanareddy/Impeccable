# API.md — example shape

The canonical API-context file written by `init`. Copy this shape; keep it tight.

```markdown
# Audience & style
audience: public (every decision is permanent) · style: REST JSON
consumers' ecosystems: JS, Python, mobile — drives casing and SDK priority

# Conventions
field casing: snake_case · date format: RFC 3339 UTC · id strategy: ULID
error envelope: RFC 9457 problem+json with a stable `code` member
pagination: cursor-based, limit 20 default / 100 max · idempotency: Idempotency-Key on POST/PATCH

# Vocabulary (frozen names)
order, checkout, settlement (= post-payment reconciliation), invoice — one name per concept

# Versioning & compatibility
mechanism: /api/v1 path · N-1 supported 12 months · deprecation: Deprecation+Sunset headers,
changelog entry, migration example per change

# Security model
authn: OAuth2 bearer · authz: ABAC (owner/member/admin) in one middleware layer
rate limits: 100 r/m per key, headers on every 429

# The spec
location: openapi/openapi.yaml · CI: openapi-diff gate fails on drift · SDKs generated from it
```
