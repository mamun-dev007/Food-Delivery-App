// Customer-dashboard API clients.
// Notifications are real, order-derived data from the backend/DB. Everything
// here reuses the shared apiClient (Firebase auth token attached automatically).

import { apiClient } from "./apiClient";

// Real, per-customer notifications (derived from the user's order-summary rows).
export async function fetchCustomerNotifications() {
  const { data } = await apiClient.get("/api/customer/notifications");
  return {
    notifications: data.notifications || [],
    unread_count: data.unread_count || 0,
  };
}

// Mark notifications as read. With `time`, marks everything up to that
// notification (called when the user clicks a specific item); without it,
// marks all as read. Persisted on the backend.
export async function markNotificationsRead(time) {
  const body = time ? { time } : {};
  const { data } = await apiClient.post("/api/customer/notifications/read", body);
  return data;
}

// Active promotions (real coupons from the DB).
export async function fetchActiveCoupons() {
  try {
    const { data } = await apiClient.get("/api/coupons", { timeout: 4000 });
    return data.coupons || [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Client-side preference storage. The app has no backend for addresses /
// payment methods / settings / favorite-restaurants yet, so we persist them
// locally (same pattern already used for cart + favorites). Data shown is the
// user's own — never fabricated.
// ---------------------------------------------------------------------------

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full/blocked — non-critical.
  }
}

const ADDRESSES_KEY = "foodie_customer_addresses";
const PAYMENTS_KEY = "foodie_customer_payments";
const SETTINGS_KEY = "foodie_customer_settings";
const FAVORITE_RESTAURANTS_KEY = "foodie_favorite_restaurants";

function scopedKey(key) {
  try {
    const user = JSON.parse(localStorage.getItem("mamun_auth_user") || "null");
    return `${key}_${user?.id || "guest"}`;
  } catch {
    return `${key}_guest`;
  }
}

export const loadAddresses = () => readLS(scopedKey(ADDRESSES_KEY), []);
export const saveAddresses = (list) => writeLS(scopedKey(ADDRESSES_KEY), list);

export const loadPaymentMethods = () => readLS(scopedKey(PAYMENTS_KEY), []);
export const savePaymentMethods = (list) => writeLS(scopedKey(PAYMENTS_KEY), list);

export const loadCustomerSettings = () =>
  readLS(scopedKey(SETTINGS_KEY), {
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotions: true,
    language: "en",
  });
export const saveCustomerSettings = (settings) =>
  writeLS(scopedKey(SETTINGS_KEY), settings);

export const loadFavoriteRestaurants = () =>
  readLS(scopedKey(FAVORITE_RESTAURANTS_KEY), []);
export const saveFavoriteRestaurants = (list) =>
  writeLS(scopedKey(FAVORITE_RESTAURANTS_KEY), list);

export const CUSTOMER_LS_KEYS = [
  ADDRESSES_KEY,
  PAYMENTS_KEY,
  SETTINGS_KEY,
  FAVORITE_RESTAURANTS_KEY,
];