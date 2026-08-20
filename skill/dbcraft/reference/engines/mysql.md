# Engine sheet: MySQL

Loaded with the relevant domains when the engine is MySQL. The native-accent specifics; the
compass domains still hold.

## Storage & charset

- **InnoDB** for every table (transactions, row locks, FKs); `utf8mb4` charset and collation
  explicitly — the default `utf8` alias is not UTF-8 (`domains/types.md`'s deliberate-sizes
  rule applies to charsets too).
- `BIGINT UNSIGNED AUTO_INCREMENT` identity, or `BINARY(16)` UUIDs where distribution demands;
  never expose auto-increment where volume is sensitive (`domains/keys.md`).

## Time (the MySQL trap)

- `TIMESTAMP` is UTC-normalized but range-limited (1970–2038); `DATETIME` is wall-clock with
  no zone. The policy: **store UTC** (`TIMESTAMP` where the range allows, `DATETIME` + UTC
  discipline elsewhere), convert at the edge, document per column (`domains/types.md`).
- `CURRENT_TIMESTAMP` defaults on both; explicit `DEFAULT`/`ON UPDATE` clauses are part of the
  contract, not an afterthought.

## Constraints & indexes

- FKs require InnoDB (a MyISAM FK "works" silently as a no-op — check the engine
  (`domains/constraints.md`'s "the schema says what is true").
- `CHECK` is enforced in MySQL 8.0.16+; on older versions, checks live in triggers or app
  validation — stated, not silent (`domains/constraints.md`).
- Index prefix lengths for long string indexes (`VARCHAR(255)` unique needs a prefix on some
  configurations) — deliberate, documented.
- `EXPLAIN ANALYZE` for the plan; `information_schema.statistics` for the unused-index audit.

## Operations

- Online DDL (`ALGORITHM=INPLACE, LOCK=NONE`) for hot-table changes — the non-locking forms
  (`domains/migrations.md`); `pt-online-schema-change`-style tooling for the big ones.
- `mysqldump --no-data` snapshots are the schema-diff input (`schema-diff`).

## Bans

MyISAM tables, latin1/utf8mb3 charsets, tz-less DATETIME policies, silent CHECK no-ops on old
versions, FK-ignoring engines, locking DDL on hot tables.
