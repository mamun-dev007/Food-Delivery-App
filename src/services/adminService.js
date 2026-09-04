// Admin API client for the admin dashboard. All calls go through apiClient so
// the Firebase ID token is attached and the backend verifyRole("admin") guard
// enforces authorization on every route.

import { apiClient } from "./apiClient";

// Safe fallbacks — empty/minimal shapes only, never fabricated data.
const EMPTY_OVERVIEW = () => ({
  stats: {
    total_orders: 0,
    orders_change: 0,
    total_customers: 0,
    customers_change: 0,
    total_restaurants: 0,
    restaurants_change: 0,
    total_riders: 0,
    riders_change: 0,
    total_revenue: 0,
    restaurant_payout: 0,
    commission_rate: 5,
    completed_orders: 0,
    revenue_change: 0,
    pending_orders: 0,
    pending_change: 0,
  },
  revenue: { today: { current: 0, previous: 0 }, week: [], month: [], year: [] },
  revenue_log: [],
  order_analytics: {},
  user_distribution: { customers: 0, owners: 0, riders: 0, total: 0 },
  top_restaurants: [],
  top_foods: [],
  recent_notifications: [],
  recent_orders: [],
  recent_users: [],
  top_riders: [],
});

/** Fetch the full admin dashboard bundle (real MongoDB data). */
export async function fetchAdminOverview() {
  try {
    const { data } = await apiClient.get("/api/admin/overview");
    return data.overview || EMPTY_OVERVIEW();
  } catch (err) {
    console.warn("Admin overview unavailable:", err.message);
    return EMPTY_OVERVIEW();
  }
}

/** Fetch all platform orders (newest first) for the admin Orders page. */
export async function fetchAdminOrders() {
  const { data } = await apiClient.get("/api/admin/orders");
  return data.orders || [];
}

/** Fetch platform stats (users, restaurants, riders, revenue, monthly, payment). */
export async function fetchAdminStats() {
  const { data } = await apiClient.get("/api/admin/stats");
  return (
    data.stats || {
      total_users: 0,
      active_users: 0,
      total_restaurants: 0,
      active_restaurants: 0,
      total_riders: 0,
      active_riders: 0,
      total_orders: 0,
      total_revenue: 0,
      restaurant_payout: 0,
      commission_rate: 5,
      completed_orders: 0,
      monthly: [],
      revenue_by_payment: {},
    }
  );
}

/** List all customer accounts. */
export async function fetchAdminUsers() {
  const { data } = await apiClient.get("/api/admin/users");
  return data.users || [];
}

/** List all restaurants (joined with owner info). */
export async function fetchAdminRestaurants() {
  const { data } = await apiClient.get("/api/admin/restaurants");
  return data.restaurants || [];
}

/** List all rider accounts. */
export async function fetchAdminRiders() {
  const { data } = await apiClient.get("/api/admin/riders");
  return data.riders || [];
}

/** List the full food catalogue. */
export async function fetchAdminFoods() {
  const { data } = await apiClient.get("/api/admin/foods");
  return data.foods || [];
}

/** List food categories with item counts. */
export async function fetchAdminCategories() {
  const { data } = await apiClient.get("/api/admin/categories");
  return data.categories || [];
}

/** List latest customer reviews. */
export async function fetchAdminReviews() {
  const { data } = await apiClient.get("/api/admin/reviews");
  return data.reviews || [];
}

/** Payment breakdown + recent transactions. */
export async function fetchAdminPayments() {
  const { data } = await apiClient.get("/api/admin/payments");
  return (
    data.payments || { total_received: 0, restaurant_payout: 0, commission_rate: 5, methods: [], recent: [] }
  );
}

/** Platform analytics (charts + status counts). */
export async function fetchAdminAnalytics() {
  const { data } = await apiClient.get("/api/admin/analytics");
  return (
    data.analytics || {
      total_orders: 0,
      total_revenue: 0,
      completed_orders: 0,
      commission_rate: 5,
      monthly: [],
      revenue_by_payment: {},
      status_counts: {},
    }
  );
}

/** Platform reports summary. */
export async function fetchAdminReports() {
  const { data } = await apiClient.get("/api/admin/reports");
  return (
    data.report || {
      generated_at: null,
      total_orders: 0,
      total_revenue: 0,
      restaurant_payout: 0,
      commission_rate: 5,
      delivered_orders: 0,
      platform_sales: 0,
      avg_order_value: 0,
    }
  );
}

/** Admin notification feed (persistent, newest first). */
export async function fetchAdminNotifications(limit) {
  const { data } = await apiClient.get("/api/admin/notifications", {
    params: limit ? { limit } : undefined,
  });
  return {
    notifications: data.notifications || [],
    unread_count: Number(data.unread_count || 0),
  };
}

/** Unread admin notification count (for the navbar badge). */
export async function fetchAdminNotificationsUnreadCount() {
  const { data } = await apiClient.get("/api/admin/notifications/unread-count");
  return Number(data.unread_count || 0);
}

/** Mark a single admin notification as read. */
export async function markAdminNotificationRead(id) {
  const { data } = await apiClient.patch(`/api/admin/notifications/${id}/read`);
  return data;
}

/** Mark every admin notification as read. */
export async function markAllAdminNotificationsRead() {
  const { data } = await apiClient.patch("/api/admin/notifications/mark-all-read");
  return data;
}

/** Create an admin notification (system/manual alerts). */
export async function createAdminNotification(payload) {
  const { data } = await apiClient.post("/api/admin/notifications", payload);
  return data.notification || null;
}

/** Admin account + platform settings. */
export async function fetchAdminSettings() {
  const { data } = await apiClient.get("/api/admin/settings");
  return (
    data.settings || {
      name: "Administrator",
      email: "",
      avatar_url: "",
      platform: {
        auto_approve_restaurants: false,
        auto_approve_riders: false,
        maintenance_mode: false,
        commission_rate: 5,
      },
    }
  );
}

/** List restaurant-owner requests awaiting verification (pending/rejected). */
export async function fetchRestaurantRequests() {
  const { data } = await apiClient.get("/api/admin/restaurants/requests");
  return data.requests || [];
}

/** Approve a restaurant owner by their login record id. */
export async function approveRestaurantRequest(id) {
  const { data } = await apiClient.post(
    `/api/admin/restaurants/requests/${id}/approve`
  );
  return data;
}

/** Reject a restaurant owner by their login record id. */
export async function rejectRestaurantRequest(id) {
  const { data } = await apiClient.post(
    `/api/admin/restaurants/requests/${id}/reject`
  );
  return data;
}

// ---- Rider verification ----

/** List rider requests awaiting verification (pending/rejected). */
export async function fetchRiderRequests() {
  const { data } = await apiClient.get("/api/admin/riders/requests");
  return data.requests || [];
}

/** Approve a rider by their login record id. */
export async function approveRiderRequest(id) {
  const { data } = await apiClient.post(
    `/api/admin/riders/requests/${id}/approve`
  );
  return data;
}

/** Reject a rider by their login record id. */
export async function rejectRiderRequest(id) {
  const { data } = await apiClient.post(
    `/api/admin/riders/requests/${id}/reject`
  );
  return data;
}
