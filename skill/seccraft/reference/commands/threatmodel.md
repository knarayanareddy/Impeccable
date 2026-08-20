# Command: threatmodel

Map trust boundaries, threats, and mitigations — the signature judgment command of this skill
(`domains/trust.md` is the authority). A threat model is the difference between defending a
system and defending a rumor of one.

## Steps

1. Scope the component: the data it handles (by class — `domains/data.md`), the callers it
   serves, the dependencies it trusts.
2. Draw the trust boundaries: every entry point (HTTP, queues, files, upstream APIs) and what
   crosses it. Everything outside a boundary is untrusted.
3. Enumerate threats per boundary, STRIDE-style: spoofing (who can impersonate?), tampering
   (what inputs can be modified?), repudiation (what can be denied?), information disclosure
   (what leaks?), denial of service (what can be exhausted?), elevation of privilege (what can
   be reached with more rights?).
4. For each threat: likelihood × impact → the existing control (or the gap). Be honest — "we
   trust the internal network" is a gap with a costume.
5. Rank the gaps by risk; the top gaps become tickets with owners and dates. A threat model
   that doesn't produce tickets is a whiteboard (`domains/trust.md`).
6. Record the model in SECURITY.md (or the component's docs) — it is the security design
   document, revisited on every architecture change.

## Rules

- Threat-model the component, not the universe: scope to what ships, what holds money/PII, what
  faces the public — depth over breadth.
- Attackers use defaults and forgotten paths: pay special attention to what the team considers
  "internal", "temporary", or "already safe".
- No edits to code — the output is the model and the ticket list.

## Exit criteria

- Boundaries drawn, threats enumerated with likelihood/impact, controls vs gaps named, the top
  gaps ticketed with owners, the model recorded.
