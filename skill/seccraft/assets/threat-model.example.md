# Threat model — example shape

The canonical output shape for `threatmodel`. One table per trust boundary; the gaps become
tickets.

```markdown
# Component: <name>
data classes touched: <confidential: PII> · owners: <team>

## Boundaries
1. HTTP ingress (public) — untrusted
2. payment-api (upstream) — untrusted (upstreams get compromised)
3. DB (internal) — trusted, least-privilege accounts only

## Threats × controls × gaps
| Boundary | Threat (STRIDE) | Likelihood | Impact | Control | Gap → ticket |
|---|---|---|---|---|---|
| HTTP ingress | Tampering: order payload spoofed (T) | high | high | schema validation | — |
| payment-api | Spoofing: forged webhook (S) | med | high | HMAC signature | rotate keys annually → T-102 |
| DB | Elevation: over-broad app role (E) | low | critical | least-privilege grants | restrict now → T-103 |
| HTTP ingress | DoS: unbounded page size (D) | high | med | pagination caps | enforce → T-104 |

## Top gaps (ticketed)
T-102 · T-103 · T-104 — owners + dates in the tracker
```
