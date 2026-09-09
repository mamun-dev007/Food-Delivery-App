import { apiClient } from "./apiClient";

// localStorage key where placed orders are cached so the Invoice page can
// render immediately even if the backend is temporarily unreachable.
const LOCAL_ORDERS_KEY = "mamun_placed_orders";

function readLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalOrder(order) {
  const list = readLocalOrders().filter((o) => o.order_no !== order.order_no);
  list.unshift(order);
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
  } catch {
    // Storage may be full/blocked; non-critical.
  }
}

function updateLocalOrder(order) {
  const list = readLocalOrders().map((o) =>
    o.order_no === order.order_no ? order : o
  );
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
  } catch {
    // Storage may be full/blocked; non-critical.
  }
}

/**
 * Place a new order for the authenticated customer (Cash on Delivery — the
 * order is created immediately). Returns the created order (with order_no +
 * tracking_id). Also caches it locally so the invoice can render offline.
 */
export async function createOrder(payload) {
  const { data } = await apiClient.post("/api/user/orders", payload, {
    timeout: 8000,
  });
  if (data?.order) writeLocalOrder(data.order);
  return data.order;
}

/**
 * Reserve an order for an online payment (bKash / Nagad / Card). No real order
 * is created here — that only happens on successful payment confirmation, so
 * an order is never confirmed unless the customer actually pays.
 * Returns the payment intent (order_no, items, total, method).
 */
export async function createPaymentIntent(payload) {
  const { data } = await apiClient.post("/api/user/payments/intent", payload, {
    timeout: 8000,
  });
  return data.intent;
}

/**
 * Fetch the payment intent for the Stripe-style checkout page. Falls back to
 * the order itself (COD / already-confirmed online orders).
 */
export async function getPaymentIntent(orderNo) {
  try {
    const { data } = await apiClient.get(`/api/user/payments/${orderNo}`, {
      timeout: 4000,
    });
    return data.order;
  } catch {
    // The intent may not exist (COD order, or direct navigation) — in that
    // case the order record itself carries the same display data.
    return fetchOrder(orderNo);
  }
}

/**
 * Complete the online payment for an order (bKash / Nagad / Card).
 * Creates + confirms the real order as Paid. The Payment page calls this
 * after the customer taps "Pay now". Returns { success, alreadyPaid, order }
 * and syncs the local cache.
 */
export async function payOrder(orderNo) {
  const { data } = await apiClient.post(
    `/api/user/payments/${orderNo}/confirm`,
    {},
    { timeout: 8000 }
  );
  if (data?.order) updateLocalOrder(data.order);
  return data;
}

/**
 * Fetch a single order by its order_no for the Invoice page.
 * Falls back to the locally-cached copy if the API is unavailable.
 */
export async function fetchOrder(orderNo) {
  try {
    const { data } = await apiClient.get(`/api/user/orders/${orderNo}`, {
      timeout: 4000,
    });
    return data.order;
  } catch (err) {
    const local = readLocalOrders().find((o) => o.order_no === orderNo);
    if (local) return local;
    throw err;
  }
}

/**
 * Fetch the analytics + order history for a given time range.
 * The authenticated customer id comes from the verified Firebase token —
 * never from the client. Identity is derived server-side in /api/user/orders-summary.
 * @param {"day"|"month"|"year"} range
 * @returns {Promise<{range, from, to, total_spent, total_orders, orders[]}>}
 */
export async function fetchOrderSummary(range) {
  const { data } = await apiClient.get("/api/user/orders-summary", {
    params: { range },
    timeout: 5000,
  });
  return data;
}
