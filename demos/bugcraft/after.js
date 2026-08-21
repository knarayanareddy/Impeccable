// The bugcraft pass: root cause found (N+1 in the cart loader), fixed at the
// divergence, errors propagate, and the fix ships with its regression pin.
export async function getCart(userId) {
  const cart = await db.query("SELECT * FROM carts WHERE user = ?", [userId]);
  if (!cart.rows.length) {
    throw new NotFoundError(`getCart: no cart for user ${userId}`);
  }
  const ids = cart.rows.map((row) => row.id);
  // One query for all items — the N+1 is gone, not papered over.
  const items = await db.query("SELECT * FROM items WHERE cart IN (?)", [ids]);
  return items;
}

export function total(items) {
  return items.reduce((sum, it) => {
    if (typeof it.price !== "number" || typeof it.qty !== "number") {
      throw new TypeError("total: item price and qty must be numbers");
    }
    return sum + it.price * it.qty;
  }, 0);
}
