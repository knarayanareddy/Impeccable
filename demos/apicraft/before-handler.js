// Orders API handlers — before (generic AI API code)
// The tells: success wrappers, hardcoded credentials, SELECT *, unbounded
// page sizes, 500-with-empty-body, verbs in paths, unversioned endpoints.

const apiKey = "sk-live-9f8e7d6c5b4a3210";

app.get("/api/getUser", (req, res) => {
  db.query("SELECT * FROM users");
  res.status(200).json({ success: false, error: err.stack });
});

app.get("/api/orders", (req, res) => {
  const pageSize = 10000;
  const rows = db.query("SELECT * FROM orders");
  res.status(500).send();
});

app.get("/api/users/delete", (req, res) => {
  res.status(429).json({ error: "slow down" });
});
