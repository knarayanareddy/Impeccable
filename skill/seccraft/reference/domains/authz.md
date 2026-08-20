# Domain: Authorization

Authorization answers "may this caller touch *this* object?" — the question that turns a login
into a boundary. It is the most-exploited vulnerability class in real breaches (IDOR/BOLA), and
the most common failure is simply that nobody asked the question at object level.

## The two questions (never merge them)

1. **Authentication:** who is the caller? (identity)
2. **Authorization:** does the caller have rights to this *specific* resource? (access)

A system that checks #1 and skips #2 is the textbook IDOR: `/api/orders/12345` with a valid
session returns anyone's order. Every resource access — read and write — checks #2, at the
object level, server-side (`anti-patterns.md` A1).

## The models

- **RBAC** (roles): coarse, per-role permissions. Right for most back-office surfaces.
- **ABAC/ReBAC** (attributes/relationships): "owner of the resource", "member of the project",
  "admin of the org". Right for multi-tenant products — most real authorization is
  relationship-based.
- **Pick the model, then implement it once**: a single authorization layer (middleware/guard/
  policy engine) that every route goes through. Per-route hand-rolled checks drift — one route
  forgets, and the breach is that route.

## The implementation rules

- **Server-side, always.** Client-side hiding (buttons, disabled menus) is UX, not security.
- **Check on read and write.** Read IDOR leaks; write IDOR destroys. Both get the check.
- **Resource-scoped queries.** `WHERE user_id = :current_user` built into the data-access layer —
  not a check after the fetch (the fetch already leaked).
- **Deny by default** (`security-floor.md` #3): the unmatched case denies; permissions are
  allowlisted, never denylisted.
- **Privilege boundaries are explicit**: admin actions are separate, reviewed, logged
  (`domains/abuse.md`) — never "if (user.role == 'admin')" scattered through feature code.

## Testing authorization (`authz` ships these)

- **The matrix test:** caller × resource × action — owner, member, stranger, admin × own object,
  other's object × read/write. One test per cell that matters; the matrix is the specification
  of the authz model.
- **Negative tests are the point:** the stranger reading another's object is the test that
  matters. Positive tests prove features; negative tests prove security.

## Bans (recap)

Authn-without-authz, client-side-only checks, post-fetch checks, scattered role logic, denylist
defaults, untested object-level access.
