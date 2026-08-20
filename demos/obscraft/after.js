// OpsBoard observability — after (the obscraft pass)
// Same jobs, stated signals: structured fields with correlation ids,
// batch logging, percentiles, one vocabulary, errors that say what broke.

import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("checkout");
export const CHECKOUT_LATENCY = "checkout_latency_seconds";
export const CHECKOUT_ERRORS = "checkout_errors_total";

async function checkout(order, user) {
  const span = tracer.startSpan("checkout.complete", {
    attributes: { order_id: order.id, user_id: user.id },
  });
  try {
    const res = await fetch("https://payments.internal/charge", {
      headers: { traceparent: span.spanContext().traceId },
    });
    metrics.observe(CHECKOUT_LATENCY, res.duration, { status: res.ok ? "ok" : "failed" });
    if (!res.ok) metrics.inc(CHECKOUT_ERRORS, { status: "failed" });
    logger.info("checkout.completed", {
      orderId: order.id,
      status: res.ok ? "ok" : "failed",
      traceId: span.spanContext().traceId,
    });
    // one aggregate line per batch, not one per item
    logger.debug("checkout.items", { count: order.items.length });
    return res;
  } catch (err) {
    logger.error("checkout.failed", {
      orderId: order.id,
      error: err.code,
      message: err.message,
      traceId: span.spanContext().traceId,
    });
    throw err;
  }
}
