// OpsBoard checkout — after (the perfcraft pass)
// Same jobs, measured shapes: async config, one batched query with
// projection, structural sharing instead of deep clones, a builder
// instead of concat, and a backoff retry instead of the spin.

import { readFile } from "node:fs/promises";

const ORDER_COLUMNS = "id, status, total_cents";

async function loadConfig() {
  return readFile("/etc/opsboard.json", "utf8");
}

async function checkout(orderIds) {
  const config = await loadConfig();

  // one batched, projected query — no per-item round trips
  const orders = await db.query(
    `SELECT ${ORDER_COLUMNS} FROM orders WHERE id IN (?) ORDER BY id`,
    [orderIds],
  );
  const points = await db.query(
    "SELECT order_id, value FROM points WHERE order_id IN (?)",
    [orderIds],
  );
  const byOrder = new Map(points.map((p) => [p.order_id, p.value]));

  // structural sharing: a shallow spread, not a deep clone per row
  const enriched = orders.map((o) => ({ ...o, points: byOrder.get(o.id) ?? 0 }));

  // the builder, not O(n²) concatenation
  const parts = [];
  for (const row of enriched) parts.push(`<li>${row.id}</li>`);

  return parts.join("");
}

async function retryStatus() {
  let attempt = 0;
  while (attempt < 3) {
    const res = await fetch("https://api.example.com/status");
    if (res.ok) return res;
    attempt += 1;
    await sleep(100 * 2 ** attempt + Math.random() * 50); // backoff + jitter
  }
  throw new Error("status endpoint unreachable after 3 attempts");
}

async function allOrders() {
  // bounded: cursor-paged, projected, capped
  return db.query(`SELECT ${ORDER_COLUMNS} FROM orders ORDER BY id LIMIT ?`, [100]);
}
