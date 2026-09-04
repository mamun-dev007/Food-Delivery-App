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

/**
 * Place a new order for the authenticated customer.
 * Returns the created order (with order_no + tracking_id). Also caches it
 * locally so the invoice can render offline.
 */
export async function createOrder(payload) {
  const { data } = await apiClient.post("/api/user/orders", payload, {
    timeout: 8000,
  });
  if (data?.order) writeLocalOrder(data.order);
  return data.order;
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
