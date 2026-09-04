// Order status helpers shared across the customer dashboard.
// Accepts both the real API vocabulary ("Pending", "On The Way", …) and the
// lower-case bridge statuses (pending, ready_for_pickup, rider_assigned, …).

export const STATUS_META = {
  pending: { label: "Pending", badge: "bg-warning/20 text-warning", dot: "bg-warning" },
  confirmed: { label: "Confirmed", badge: "bg-warning/20 text-warning", dot: "bg-warning" },
  preparing: { label: "Preparing", badge: "bg-warning/20 text-warning", dot: "bg-warning" },
  ready_for_pickup: { label: "Ready for Pickup", badge: "bg-primary/15 text-primary", dot: "bg-primary" },
  rider_assigned: { label: "Rider Assigned", badge: "bg-primary/15 text-primary", dot: "bg-primary" },
  picked_up: { label: "Picked Up", badge: "bg-primary/15 text-primary", dot: "bg-primary" },
  on_the_way: { label: "On The Way", badge: "bg-primary/15 text-primary", dot: "bg-primary" },
  delivered: { label: "Delivered", badge: "bg-success/15 text-success", dot: "bg-success" },
  cancelled: { label: "Cancelled", badge: "bg-error/15 text-error", dot: "bg-error" },
};

// Delivery tracker steps (from the design brief).
export const ORDER_STEPS = [
  "Order Confirmed",
  "Preparing",
  "Rider Picked Up",
  "On The Way",
  "Delivered",
];

const STEP_INDEX = {
  pending: 0,
  confirmed: 0,
  preparing: 1,
  ready_for_pickup: 1,
  rider_assigned: 1,
  picked_up: 2,
  on_the_way: 3,
  delivered: 4,
};

// Normalise an API status value into a lower-case bridge key.
export function normalizeStatus(status) {
  const s = String(status || "").trim();
  const key = s.toLowerCase().replace(/\s+/g, "_");
  return STATUS_META[key] ? key : key;
}

// Current tracker index for a status, or -1 when cancelled/unknown.
export function trackerIndex(status) {
  const key = normalizeStatus(status);
  return key === "cancelled" ? -1 : STEP_INDEX[key] ?? -1;
}

export function isActiveStatus(status) {
  const key = normalizeStatus(status);
  return key !== "cancelled" && key !== "delivered" && STATUS_META[key] != null;
}

export function statusMeta(status) {
  return STATUS_META[normalizeStatus(status)] || STATUS_META.pending;
}