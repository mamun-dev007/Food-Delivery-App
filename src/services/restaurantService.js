// Owner-scoped restaurant data (real, from the backend/DB).
import { apiClient } from "./apiClient";

// The owner's restaurant's real orders (newest first).
export async function fetchOwnerOrders() {
  const { data } = await apiClient.get("/api/owner/orders");
  return data.orders || [];
}

// Real order totals for the dashboard stat cards.
export async function fetchOwnerOrderSummary() {
  const { data } = await apiClient.get("/api/owner/orders/summary");
  return data.summary || {
    total_orders: 0,
    active_orders: 0,
    revenue: 0,
  };
}

// Restaurant employee advances an order's status (Pending -> Preparing ->
// On The Way -> Delivered / Cancelled). Persisted to MongoDB.
export async function updateOwnerOrderStatus(orderNo, status) {
  const { data } = await apiClient.patch(`/api/owner/orders/${orderNo}/status`, {
    status,
  });
  return data;
}

// ------------------------------------------------------------------
// Restaurant profile (Manage Restaurant page).
// ------------------------------------------------------------------

// Fetch the owner's own restaurant profile from MongoDB.
export async function fetchOwnerRestaurantProfile() {
  const { data } = await apiClient.get("/api/owner/restaurant");
  return data.restaurant || {};
}

// Persist profile edits (name, cuisine, address, open/closed, etc.) to MongoDB.
export async function updateOwnerRestaurantProfile(profile) {
  const { data } = await apiClient.put("/api/owner/restaurant", profile);
  return data.restaurant || profile;
}

// ------------------------------------------------------------------
// Restaurant categories (owner-scoped, real MongoDB data).
// ------------------------------------------------------------------

export async function fetchOwnerCategories() {
  const { data } = await apiClient.get("/api/owner/categories");
  return data.categories || [];
}

export async function createOwnerCategory(name) {
  const { data } = await apiClient.post("/api/owner/categories", { name });
  return data.category;
}

export async function deleteOwnerCategory(id) {
  const { data } = await apiClient.delete(`/api/owner/categories/${id}`);
  return data;
}

// ------------------------------------------------------------------
// Restaurant reviews (owner-scoped, real MongoDB data).
// ------------------------------------------------------------------

export async function fetchOwnerReviews() {
  const { data } = await apiClient.get("/api/owner/reviews");
  return {
    reviews: data.reviews || [],
    rating: data.rating || { avg: 0, count: 0, distribution: {} },
  };
}

// ------------------------------------------------------------------
// Sales analytics / earnings.
// ------------------------------------------------------------------

export async function fetchOwnerAnalytics() {
  const { data } = await apiClient.get("/api/owner/analytics");
  return (
    data.analytics || {
      commission_rate: 5,
      today: { orders: 0, revenue: 0 },
      totals: { total_orders: 0, pending: 0, delivered: 0, total_foods: 0 },
      status_counts: { Pending: 0, Preparing: 0, "On The Way": 0, Delivered: 0, Cancelled: 0 },
      popular_foods: [],
      daily_sales: [],
      monthly_sales: [],
      revenue_by_payment: {},
    }
  );
}

export async function fetchOwnerEarnings() {
  const { data } = await apiClient.get("/api/owner/earnings");
  return (
    data.earnings || {
      gross: 0,
      subtotal: 0,
      commission: 0,
      commission_rate: 5,
      delivery_fees: 0,
      discounts: 0,
      net: 0,
      total_orders: 0,
      avg_order: 0,
      avg_net: 0,
      top_items: [],
      history: [],
    }
  );
}

// ------------------------------------------------------------------
// Offers / coupons.
// ------------------------------------------------------------------

export async function fetchOwnerCoupons() {
  const { data } = await apiClient.get("/api/owner/coupons");
  return data.coupons || [];
}

export async function createOwnerCoupon(payload) {
  const { data } = await apiClient.post("/api/owner/coupons", payload);
  return data.coupon;
}

export async function deleteOwnerCoupon(id) {
  await apiClient.delete(`/api/owner/coupons/${id}`);
}

// ------------------------------------------------------------------
// Notifications & settings.
// ------------------------------------------------------------------

export async function fetchOwnerNotifications() {
  const { data } = await apiClient.get("/api/owner/notifications");
  return {
    notifications: data.notifications || [],
    unread_count: data.unread_count || 0,
  };
}

export async function markOwnerNotificationsRead(time) {
  const body = time ? { time } : {};
  const { data } = await apiClient.post("/api/owner/notifications/read", body);
  return data;
}

export async function fetchOwnerSettings() {
  const { data } = await apiClient.get("/api/owner/settings");
  return (
    data.settings || {
      deliveryTime: "25 min",
      minOrder: 0,
      currency: "৳",
      autoAcceptOrders: false,
      emailNotifications: true,
      smsNotifications: false,
    }
  );
}

export async function updateOwnerSettings(payload) {
  const { data } = await apiClient.put("/api/owner/settings", payload);
  return data.settings;
}
