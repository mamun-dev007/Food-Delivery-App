// Rider-scoped data (real, from the backend/DB).
import { apiClient } from "./apiClient";

export const EMPTY_OVERVIEW = {
  today_deliveries: 0,
  completed_deliveries: 0,
  pending_deliveries: 0,
  today_earnings: 0,
  rating: 0,
  total_reviews: 0,
  active_delivery: null,
  active_orders: [],
  status_counts: {},
};

export const EMPTY_EARNINGS = {
  today: 0,
  this_week: 0,
  this_month: 0,
  this_year: 0,
  total_earnings: 0,
  total_deliveries: 0,
  avg: 0,
  delivery_fees: 0,
  bonuses: 0,
  tips: 0,
  withdrawable: 0,
  weekly: [],
  transactions: [],
};

export const EMPTY_PERFORMANCE = {
  weekly: [],
  monthly: [],
  totals: { deliveries: 0, earnings: 0, avg_order: 0 },
  rates: { acceptance_rate: 0, completion_rate: 0, on_time_rate: 0, rating: 0 },
};

// Orders this rider can claim.
export async function fetchAvailableOrders() {
  const { data } = await apiClient.get("/api/rider/available");
  return data.available || [];
}

// This rider's deliveries, split into active + history.
export async function fetchMyOrders() {
  const { data } = await apiClient.get("/api/rider/my-orders");
  return { active: data.active || [], history: data.history || [] };
}

// Claim an order for the current rider.
export async function acceptOrder(orderNo) {
  const { data } = await apiClient.post(`/api/rider/orders/${orderNo}/accept`);
  return data;
}

// Advance a claimed order's delivery status (strict flow enforced server-side).
export async function updateOrderStatus(orderNo, status) {
  const { data } = await apiClient.patch(
    `/api/rider/orders/${orderNo}/status`,
    { status },
  );
  return data;
}

// Real earnings breakdown (today / week / month / total + series + transactions).
export async function fetchEarnings() {
  const { data } = await apiClient.get("/api/rider/earnings");
  return { ...EMPTY_EARNINGS, ...(data || {}) };
}

// Rider dashboard overview: stat cards + active delivery + rating.
export async function fetchOverview() {
  const { data } = await apiClient.get("/api/rider/overview");
  return { ...EMPTY_OVERVIEW, ...(data.overview || {}) };
}

// Performance series (weekly/monthly) + derived rates.
export async function fetchPerformance() {
  const { data } = await apiClient.get("/api/rider/performance");
  return {
    ...EMPTY_PERFORMANCE,
    weekly: data.performance?.weekly || [],
    monthly: data.performance?.monthly || [],
    totals: data.performance?.totals || EMPTY_PERFORMANCE.totals,
    rates: data.performance?.rates || EMPTY_PERFORMANCE.rates,
  };
}

// Reviews left on this rider's deliveries.
export async function fetchRiderReviews() {
  const { data } = await apiClient.get("/api/rider/reviews");
  return { reviews: data.reviews || [], avg: data.avg || 0, count: data.count || 0 };
}

// Rider notifications (with read state + unread_count).
export async function fetchRiderNotifications() {
  const { data } = await apiClient.get("/api/rider/notifications");
  return { notifications: data.notifications || [], unread_count: data.unread_count || 0 };
}

// Mark all rider notifications as read.
export async function markNotificationsRead() {
  const { data } = await apiClient.post("/api/rider/notifications/read");
  return data;
}

// Rider profile (real login doc + derived stats).
export async function fetchRiderProfile() {
  const { data } = await apiClient.get("/api/rider/profile");
  return data.rider || null;
}

// Flip availability: { online: boolean }.
export async function setRiderOnline(online) {
  const { data } = await apiClient.post("/api/rider/online", { online });
  return data.isOnline;
}

// Paginated, searchable delivery history.
export async function fetchRiderHistory(params = {}) {
  const { data } = await apiClient.get("/api/rider/history", { params });
  return {
    history: data.history || [],
    page: data.page || 1,
    limit: data.limit || 8,
    total: data.total || 0,
    pages: data.pages || 1,
  };
}

// Rider settings.
export async function fetchRiderSettings() {
  const { data } = await apiClient.get("/api/rider/settings");
  return (
    data.settings || {
      phone: "",
      vehicle: "Bike",
      max_distance: 15,
      notifications: true,
    }
  );
}

export async function updateRiderSettings(payload) {
  const { data } = await apiClient.put("/api/rider/settings", payload);
  return data.settings;
}