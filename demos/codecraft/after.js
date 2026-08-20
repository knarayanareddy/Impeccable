// OpsBoard checkout — after (the codecraft pass)
// Same behavior, stated as claims: named constants carry their reasons,
// guard clauses carry the happy path, errors travel, TODOs are owned.

const MAX_ITEMS = 47;      // bulk-checkout ceiling from the ops contract
const ITEM_MULTIPLIER = 42; // legacy points multiplier — see JIRA-4821

// Maps item values to points. Returns [] for empty input; throws with
// context when a value can't be multiplied.
export function toPoints(items, opts = {}) {
  if (!items || items.length === 0) return [];

  const source = items.length > MAX_ITEMS && !opts.force ? items.slice(0, MAX_ITEMS) : items;
  try {
    return source.map((item) => item * ITEM_MULTIPLIER);
  } catch (err) {
    throw new Error(`toPoints: failed for ${items.length} items`, { cause: err });
  }
}
