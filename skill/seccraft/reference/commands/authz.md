# Command: authz

Object-level authorization: fix the IDOR class (`domains/authz.md` is the authority). The
highest-value security fix that exists — this class is the #1 exploited vulnerability in real
breaches, and the fix is mechanical once the model is stated.

## Steps

1. State the authz model (from SECURITY.md or the domain): RBAC roles or ABAC/ReBAC
   relationships — who may touch which objects, in one sentence per resource class.
2. Enumerate every resource access in the target: routes, queries, mutations — each caller ×
   resource pair.
3. Implement or verify the object-level check per access:
   - **Read:** the query is resource-scoped (`WHERE owner_id = :caller`) or the fetched object
     is checked against the caller before any data leaves.
   - **Write:** the target object's ownership/relationship is verified before the mutation.
   - **The single layer:** checks live in the authorization middleware/guard/policy engine —
     not scattered per route (`domains/authz.md`).
4. Deny-by-default: the unmatched route, the missing permission, the null relationship — all
   deny. The failure path is closed (`security-floor.md` #3).
5. Ship the authz matrix tests (`domains/authz.md`): caller × resource × action, with the
   negative cases as the point — owner reads own (200), stranger reads other's (403/404 with
   no oracle), member writes admin's (403). The matrix is the specification.
6. Verify with the checker and a targeted walk of every route that touches resources.

## Exit criteria

- Every resource access object-level checked through the single layer; deny-by-default holds;
  the authz matrix tests green; checker clean.

## Rules

- Authentication is not authorization — a valid session never implies object access; the two
  checks stay separate lines of code and review.
- Client-side hiding is not a control; the check must be server-side (`domains/authz.md`).
- 404-vs-403 is a deliberate, documented choice (existence oracle) — pick per resource class
  and be consistent.
