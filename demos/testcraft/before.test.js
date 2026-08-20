// OpsBoard checkout tests — before (generic AI suite)
// The tells: focused test left in, skipped debt, tautology, empty test,
// sleep-as-sync, unseeded randomness, retry mask.

describe("checkout", () => {
  it.only("adds an item", () => {
    expect(true).toBe(true);
  });

  it.skip("removes an item", () => {
    expect(cart.size).toBe(0);
  });

  it("clears the cart", () => {});

  it("applies the discount", async () => {
    await new Promise((r) => setTimeout(r, 500));
    const seed = Math.random();
    expect(cart.total).toBeTruthy();
  });

  test.retryTimes(3)("handles the retry", () => {
    expect(charge()).toBe(42);
  });
});
