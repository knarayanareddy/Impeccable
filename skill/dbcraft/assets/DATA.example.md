# DATA.md — example shape

The canonical data-conventions file written by `init`. Copy this shape; keep it tight.

```markdown
# Engine & tooling
engine: PostgreSQL 16 · migrations: <tool> in migrations/ · hot queries list: see below

# Conventions
naming: tables plural, columns snake_case, FK = {table}_id
keys: BIGINT identity (default) · UUID for distributed/unguessable
time: timestamptz, UTC everywhere · money: NUMERIC(12,2) or integer minor units

# Policy
soft deletes: deleted_at + partial unique indexes (documented per table)
multi-tenancy: RLS on tenant_id, deny-by-default, service account cannot BYPASSRLS
retention: <policy per data class>

# Hot queries (must stay index-backed)
1. <query pattern> — <why it's hot, what index serves it>
2. ...
3. ...

# Frozen zones
<legacy tables/systems that must not be touched, with the reason>
```
