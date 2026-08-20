// OpsBoard checkout — before (generic AI performance)
// The tells: sync I/O in the handler, the N+1 loop, a busy retry spin,
// SELECT *, unbounded loads, string building in a loop, deep clones.

const fs = require("fs");

async function checkout(orderIds) {
  const config = fs.readFileSync("/etc/opsboard.json");

  const enriched = [];
  for (const id of orderIds) {
    const order = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
    const points = await db.query("SELECT * FROM points WHERE order_id = ?", [id]);
    enriched.push({ ...JSON.parse(JSON.stringify(order)), points });
  }

  let html = "";
  for (const row of enriched) {
    html += "<li>" + row.id + "</li>";
  }

  while (true) {
    await fetch("https://api.example.com/status");
  }
  return html;
}

async function allOrders() {
  return db.find();
}
