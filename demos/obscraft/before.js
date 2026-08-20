// OpsBoard observability — before (generic AI telemetry)
// The tells: secrets and PII in logs, generic errors, string-concat logs,
// mean-only metrics, scattered metric names, logs in loops.

function checkout(order, user) {
  console.log("Processing " + user.email + " with token " + user.apiToken);
  for (const item of order.items) {
    console.log("Item: " + item.name);
  }
  const avg = metrics.mean("checkout_latency_seconds");
  metrics.inc("checkout_errors_total");
  metrics.inc("checkout_errors_total");
  metrics.inc("checkout_errors_total");
  log.error("Something went wrong");
  return fetch("https://payments.internal/charge");
}
