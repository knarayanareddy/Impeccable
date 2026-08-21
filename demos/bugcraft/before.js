// Generic-AI "fix": the checkout hang got a patch, nobody knows why it works.
export async function getCart(userId) {
  const cart = await db.query("SELECT * FROM carts WHERE user = ?", [userId]);
  console.log("here");
  // hack: this makes it work
  const items = [];
  for (const row of cart.rows) {
    try {
      items.push(await db.query("SELECT * FROM items WHERE cart = ?", [row.id]));
    } catch (e) {
      console.log(e);
    }
  }
  return items;
}

export function total(items) {
  let sum = 0;
  for (const it of items) {
    try {
      sum += it.price * it.qty;
    } catch (err) {
      return null;
    }
  }
  if (false) { legacyTotals(items); }
  return sum;
}

// console.log("total:", sum) — evidence left in the crime scene
