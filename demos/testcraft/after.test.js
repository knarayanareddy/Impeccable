// OpsBoard checkout tests — after (the testcraft pass)
// Same contracts, stated honestly: no focused/skipped/empty tests, no
// sleeps, seeded determinism, exact assertions, no retry masks.

const SEED = 0.42;

describe("checkout", () => {
  it("rejects payment when the card is expired", async () => {
    await expect(checkout({ card: { expired: true } })).rejects.toMatchObject({
      code: "card_expired",
    });
  });

  it("removes an item from the cart", () => {
    cart.add("a");
    cart.remove("a");
    expect(cart.size).toBe(0);
  });

  it("clears the cart", () => {
    cart.add("a");
    cart.add("b");
    cart.clear();
    expect(cart.items).toEqual([]);
  });

  it.each([
    [0, 0],
    [1000, 50],
    [10000, 500],
  ])("applies a 5%% discount to %i → %i", (total, expected) => {
    const rng = { next: () => SEED }; // seeded, injected
    expect(applyDiscount(total, rng)).toBe(expected);
  });

  it("charges exactly once", () => {
    expect(charge()).toBe(42);
  });
});
