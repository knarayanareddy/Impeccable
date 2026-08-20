# Command: denormalize

Introduce deliberate, measured duplication — never speculative, never unowned
(`domains/normalization.md` is the authority). This command earns its keep by *refusing* most of the
time.

## The gate (all must pass before any denormalization)

1. **Measured pain:** a real query was profiled (plan + latency on production-sized data) and the
   join/aggregation is the bottleneck. A hunch is not a measurement.
2. **Named writer:** one code path (or trigger/materialized view) owns the duplicate — stated in
   the schema comment or DATA.md.
3. **Reconciliation job:** a backfill/verify script exists to rebuild or re-check the duplicate —
   written, not promised.
4. **Accepted staleness:** the product accepts the documented freshness window.
5. **Normalization was the baseline:** the schema is otherwise 3NF; denormalization is the
   exception, not the style.

## The legitimate forms

- **Cached aggregates** — `orders_count` on `customers`, maintained by counter/trigger or a job.
- **Historical snapshots** — invoice line items copied from products: they record what was true at
  sale time (truth, not drift — still needs the writer contract).
- **Search/facet tables** — a shape optimized for a read pattern the canonical shape can't serve.
- **Materialized views** — the database-owned version of the same idea, with a refresh schedule.

## Steps

1. Document the gate's five answers in the migration comment or DATA.md — that block is the
   denormalization's birth certificate.
2. Implement: the new column/table, the writer (trigger/job/code path), the backfill, the
   reconciliation script.
3. Verify: the target query's plan/latency before vs after (the numbers that justified it must
   appear), the reconciliation script runs clean, the staleness window holds under the real write
   rate.

## Rules

- Duplication without the five gate answers is debt — refuse and say why. Refusal is output.
- The reconciliation job is shipped in the same change as the duplication, never "later".
- If the measured pain goes away (schema change, better query), remove the denormalization — it is
  a loan, not a purchase.

## Exit criteria

- Gate documented, writer + reconciliation shipped, before/after numbers quoted, removal trigger
  noted (what would make this unnecessary again).
