# Domain: Trust

Trust is the foundation of security design. Everything else — authn, authz, validation — is the
machinery that enforces a trust model. Get the model right and the rest follows; skip it and the
rest is decoration. This is the differentiator domain.

## The trust model

- **A trust boundary is a line in the architecture** where the level of trust changes. Inside it,
  components may trust each other's data; outside it, everything is hostile.
- **Name the boundaries per component** (`threatmodel` draws them): where does untrusted input
  enter (HTTP, files, queues, upstream APIs), what crosses each boundary, and what must be
  validated at the crossing.
- **The default stance is distrust.** User input, headers, cookies, files, upstream responses,
  environment, DNS — all untrusted. A component that "trusts" an upstream API is an assumption;
  write it down and validate anyway (upstreams get compromised).

## The rules that follow from the model

1. **Validate at the boundary, then simplify.** Input is validated where it crosses the line —
   then internal code can assume validity. Validation at every layer is defense-in-depth noise;
   validation at the boundary is a guarantee (`domains/injection.md`).
2. **Least privilege through the graph.** Every component, service account, and token holds the
   minimum rights for its job. A component that can write what it only reads is a breach
   amplifier.
3. **Compartmentalize the blast radius.** If this component were breached, what could the
   attacker reach? The answer is the design requirement: separate tenants, separate credentials,
   separate networks where the data's sensitivity demands it (`security-floor.md` Reflexes).
4. **Fail closed.** Unknown → deny; error → deny; timeout → deny. The failure path is the
   attacker's favorite path — design it first.

## The threat-modeling loop (`threatmodel` implements this)

1. Draw the component and its boundaries.
2. List the data and actions that cross each boundary (STRIDE-style: spoofing, tampering,
   repudiation, information disclosure, denial of service, elevation of privilege).
3. For each threat: the likelihood, the impact, the existing control, and the gap.
4. Rank the gaps; the top gaps become tickets with owners — a threat model without tickets is a
   whiteboard.

## Errors and oracles

Every error message is information: field existence, timing, enumeration. Design responses to
reveal the minimum: same shape for "wrong password" and "no such user", same timing for hit and
miss (`security-floor.md` #4).

## Bans (recap)

Unstated trust ("we trust the internal network"), boundary-less validation (everywhere = nowhere),
fail-open defaults, wide privilege, un-scoped blast radius, threat models without tickets.
