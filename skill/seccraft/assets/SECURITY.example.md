# SECURITY.md — example shape

The canonical security-context file written by `init`. Copy this shape; keep it tight.

```markdown
# Data classification
confidential: user PII, credentials · internal: business metrics · public: docs
policy per class: encryption at rest, restricted access, retention 12mo (confidential)

# Auth model
authn: OAuth2 bearer (API) + session cookies (web: Secure+HttpOnly+SameSite=Lax)
authz: ABAC — owner/member/admin, ONE middleware layer (server/authz/), deny-by-default
CSRF: SameSite + origin checks on cookie-auth state changes

# Trust boundaries
public ingress → validated at the edge · upstream APIs → HMAC + replay windows
see threat-model/ for the full model

# Tooling
SAST: <tool> in CI · deps: <audit tool> weekly + CI gate · secrets: <scan> pre-commit
rotations: keys per schedule in <vault>

# Compliance
<GDPR / SOC 2 / PCI> obligations and owners

# Incidents
runbooks: runbooks/security/ · escalation: <page path>
```
