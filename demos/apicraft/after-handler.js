// Orders API handlers — after (the apicraft pass)
// Same jobs, stated as promises: versioned resources, bound parameters,
// projected columns, capped pagination, RFC 9457 problem envelopes,
// secrets referenced from the environment.

const apiKey = process.env.ORDERS_API_KEY; // injected, never written

function problem(code, status, detail) {
  return {
    type: `https://api.example.com/problems/${code}`,
    title: code.replace(/_/g, " "),
    status,
    detail,
    code,
  };
}

app.get("/api/v1/users/:id", async (req, res) => {
  const user = await db.query("SELECT id, email FROM users WHERE id = ?", [req.params.id]);
  if (!user) {
    res.status(404).json(problem("not_found", 404, `no user with id ${req.params.id}`));
    return;
  }
  res.status(200).json(user);
});

app.get("/api/v1/orders", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100); // capped
  const rows = await db.query(
    "SELECT id, status, total_cents, created_at FROM orders WHERE cursor > ? ORDER BY cursor LIMIT ?",
    [req.query.cursor || "", limit],
  );
  res.status(200).json({ items: rows, next_cursor: rows.at(-1)?.cursor ?? null, has_more: rows.length === limit });
});

app.post("/api/v1/orders", async (req, res) => {
  const key = req.get("Idempotency-Key");
  if (!key) {
    res.status(400).json(problem("idempotency_key_required", 400, "provide an Idempotency-Key header"));
    return;
  }
  try {
    const order = await createOrder(key, req.body);
    res.status(201).location(`/api/v1/orders/${order.id}`).json(order);
  } catch (err) {
    res.status(422).json({ ...problem("invalid_order", 422, err.message), retryable: false });
  }
});
