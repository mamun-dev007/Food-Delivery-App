import { ObjectId } from "mongodb";

// ============================================================
// Multi-restaurant revenue: per-restaurant sub-orders + 5%/95% split.
//
// Every order doc (order-summary) carries `sub_orders[]` — one record per
// restaurant in the checkout. Each sub-order owns its own subtotal, fees,
// status and revenue split so restaurants are financially isolated.
//
//   adminCommission  = 5%  of the restaurant's subtotal
//   restaurantRevenue = 95% of the restaurant's subtotal
//   invariant: subtotal = adminCommission + restaurantRevenue (always)
//
// Revenue only exists once a sub-order is Delivered. Orders that predate this
// feature (no sub_orders field) are derived lazily via `revenueSubOrders` so
// legacy rows behave identically without a rewrite.
// ============================================================

export const COMMISSION_RATE = 0.05;

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Rank of each valid order status so mixed-restaurant orders can be collapsed
// back into one sensible top-level order status.
const STATUS_RANK = {
  Pending: 1,
  Preparing: 2,
  "On The Way": 3,
  Delivered: 4,
  Cancelled: 0,
};

// Recompute the single order-level status from per-restaurant sub-orders.
// An order is only "complete" once EVERY non-cancelled sub-order is done, so
// the aggregate tracks the least-advanced active stage:
// - any active (non-cancelled) sub-order  -> its lowest rank stage
// - all Cancelled                         -> Cancelled
// - all Delivered                         -> Delivered
export function recomputeOrderStatus(subOrders) {
  const list = Array.isArray(subOrders) ? subOrders : [];
  if (list.length === 0) return "Pending";

  const active = list.filter((s) => (s.status || "Pending") !== "Cancelled");
  if (active.length === 0) return "Cancelled";

  let lowest = { name: active[0].status || "Pending", rank: STATUS_RANK[active[0].status || "Pending"] != null ? STATUS_RANK[active[0].status || "Pending"] : 1 };
  for (const s of active) {
    const st = s.status || "Pending";
    const rank = STATUS_RANK[st] != null ? STATUS_RANK[st] : 1;
    if (rank < lowest.rank) lowest = { name: st, rank };
  }
  return lowest.name;
}

// Split `total` across weights proportionally (rounded to 2dp) so the parts
// always sum back to exactly `total` (remainder lands on the last part).
export function splitAmount(total, weights) {
  const wsum = weights.reduce((s, w) => s + Math.max(0, Number(w) || 0), 0) || 1;
  const parts = (weights || []).map((w) =>
    round2((total * Math.max(0, Number(w) || 0)) / wsum)
  );
  const diff = round2(total - parts.reduce((a, b) => a + b, 0));
  if (diff !== 0 && parts.length > 0) {
    parts[parts.length - 1] = round2(parts[parts.length - 1] + diff);
  }
  return parts;
}

function revenueSplit(subtotal) {
  const adminCommission = round2(subtotal * COMMISSION_RATE);
  const restaurantRevenue = round2(subtotal - adminCommission);
  return { adminCommission, restaurantRevenue };
}

// Group the cleaned flat line items into per-restaurant sub-orders. Each item
// may carry its own `restaurant` ({id,name,logo}); items without one fall back
// to `primaryRestaurant`. Delivery fee + discount are split proportionally so
// the combined totals match the customer-facing checkout exactly.
export function buildSubOrders({ items, primaryRestaurant, subtotal, deliveryFee, discount }) {
  const safeItems = Array.isArray(items) ? items : [];
  const groups = new Map();
  for (const it of safeItems) {
    const r = it.restaurant && it.restaurant.id != null ? it.restaurant : primaryRestaurant || {};
    const key = r && r.id != null ? String(r.id) : "unknown";
    if (!groups.has(key)) {
      groups.set(key, { restaurant: r, items: [] });
    }
    groups.get(key).items.push(it);
  }

  const list = [...groups.values()];
  if (list.length === 0) return [];

  const weights = list.map((g) =>
    g.items.reduce((s, it) => s + round2(it.unit_price * it.quantity), 0)
  );
  const subtotals = weights.map(round2);
  const deliveryFees = splitAmount(deliveryFee || 0, weights);
  const discounts = splitAmount(discount || 0, weights);

  return list.map((g, i) => {
    const s = revenueSplit(subtotals[i]);
    return {
      subOrderId: new ObjectId().toString(),
      restaurant_id: g.restaurant.id != null ? String(g.restaurant.id) : null,
      restaurant_name: String(g.restaurant.name || ""),
      restaurant_logo: String(g.restaurant.logo || ""),
      items: g.items,
      subtotal: subtotals[i],
      delivery_fee: deliveryFees[i],
      discount: discounts[i],
      total: round2(subtotals[i] + deliveryFees[i] - discounts[i]),
      status: "Pending",
      rider_status: null,
      adminCommission: s.adminCommission,
      restaurantRevenue: s.restaurantRevenue,
      revenueProcessed: false,
      completed_at: null,
    };
  });
}

// Build a single sub-order for an order that predates sub_orders (legacy flat
// doc). Returned as an array so callers can always treat the shape uniformly.
export function legacySubOrders(order) {
  if (!order || !order.restaurant_id) return [];
  const subtotal = round2(Number(order.subtotal || 0));
  const s = revenueSplit(subtotal);
  const delivered = order.status === "Delivered";
  return [
    {
      subOrderId: `legacy-${String(order._id || "order")}`,
      restaurant_id: String(order.restaurant_id),
      restaurant_name: String(order.restaurant_name || ""),
      restaurant_logo: String(order.restaurant_logo || ""),
      items: Array.isArray(order.items) ? order.items : [],
      subtotal,
      delivery_fee: round2(Number(order.delivery_fee || 0)),
      discount: round2(Number(order.discount || 0)),
      total: round2(Number(order.total_amount || 0)),
      status: order.status || "Pending",
      rider_status: order.rider_status || null,
      adminCommission: s.adminCommission,
      restaurantRevenue: s.restaurantRevenue,
      revenueProcessed: delivered,
      completed_at: delivered ? order.completed_at || order.updated_at || null : null,
    },
  ];
}

// All sub-orders for an order, deriving the legacy single sub-order when the
// field is absent (so pre-feature orders keep working everywhere).
export function subOrdersOf(order) {
  if (Array.isArray(order.sub_orders) && order.sub_orders.length > 0) {
    return order.sub_orders;
  }
  return legacySubOrders(order);
}

// The sub-order belonging to one restaurant (null when the restaurant is not
// part of this order). Handles both new (sub_orders) and legacy flat orders.
export function subOrderForRestaurant(order, restaurantId) {
  const rid = String(restaurantId || "");
  if (!rid) return null;
  if (Array.isArray(order.sub_orders) && order.sub_orders.length > 0) {
    return (
      order.sub_orders.find((s) => String(s.restaurant_id) === rid) || null
    );
  }
  if (String(order.restaurant_id || "") === rid) {
    return legacySubOrders(order)[0] || null;
  }
  return null;
}

// Normalized revenue record for a sub-order (the "revenue transaction" shape
// shared by every dashboard). Missing fields are reconstructed from the parent
// order so the history rows are always complete.
export function revenueRecord(order, sub) {
  const subStatus = (sub && sub.status) || order.status || "Pending";
  const pending = order.payment_status || "Pending";
  const completedAt =
    (sub && sub.completed_at) ||
    (subStatus === "Delivered" ? order.updated_at || order.created_at : null);
  return {
    subOrderId: (sub && sub.subOrderId) || `legacy-${String(order._id || "order")}`,
    orderNo: order.order_no || String(order._id || ""),
    orderId: String(order._id || ""),
    customerId: String(order.user_id || ""),
    customer: (order.delivery && order.delivery.name) || "",
    restaurantId: sub && sub.restaurant_id != null ? String(sub.restaurant_id) : String(order.restaurant_id || ""),
    restaurantName: (sub && sub.restaurant_name) || order.restaurant_name || "",
    subtotal: round2(Number((sub && sub.subtotal) || 0)),
    adminCommission: round2(Number((sub && sub.adminCommission) || 0)),
    restaurantPayout: round2(Number((sub && sub.restaurantRevenue) || 0)),
    status: subStatus,
    paymentStatus: pending,
    paymentMethod: order.payment_method || "Cash on Delivery",
    completedAt: completedAt ? new Date(completedAt) : null,
    createdAt: order.created_at || order.updated_at || new Date(0),
  };
}

// Flat list of Delivered revenue records across a set of order docs, newest
// completion first. This is the single source of truth for revenue figures.
export function deliveredRevenueRecords(orders) {
  const records = [];
  for (const o of orders || []) {
    if (!o || o.status !== "Delivered") continue;
    for (const sub of subOrdersOf(o)) {
      if (sub.status !== "Delivered") continue;
      records.push(revenueRecord(o, sub));
    }
  }
  return records.sort(
    (a, b) => (b.completedAt || new Date(0)) - (a.completedAt || new Date(0))
  );
}

// Aggregates for the admin side: total commission received + total paid out
// to restaurants, plus a periodic (by-day or by-month) commission series.
export function adminRevenueAggregate(orders) {
  const records = deliveredRevenueRecords(orders);
  const totalCommission = round2(
    records.reduce((s, r) => s + r.adminCommission, 0)
  );
  const totalPayout = round2(
    records.reduce((s, r) => s + r.restaurantPayout, 0)
  );
  const totalSales = round2(records.reduce((s, r) => s + r.subtotal, 0));
  return {
    records,
    totalCommission,
    totalPayout,
    totalSales,
    completedCount: records.length,
  };
}