// Coupon API client.
//   Public endpoints (list / validate) do NOT require auth.
//   Admin endpoints (create / delete) go through apiClient so the Firebase
//   ID token is attached and verifyRole("admin") enforces authorization.

import axios from "axios";
import { apiClient, API_URL } from "./apiClient";

/** List active, non-expired coupons (Offers page). */
export async function fetchCoupons() {
  const { data } = await axios.get(`${API_URL}/api/coupons`);
  return data.coupons || [];
}

/** Validate a coupon code against a subtotal. Returns the discount info. */
export async function validateCoupon(code, subtotal) {
  const { data } = await axios.post(`${API_URL}/api/coupons/validate`, {
    code,
    subtotal,
  });
  return data.coupon;
}

/** List all coupons (admin). */
export async function fetchAdminCoupons() {
  const { data } = await apiClient.get("/api/admin/coupons");
  return data.coupons || [];
}

/** Create a coupon (admin). */
export async function createAdminCoupon(payload) {
  const { data } = await apiClient.post("/api/admin/coupons", payload);
  return data.coupon;
}

/** Delete a coupon (admin). */
export async function deleteAdminCoupon(id) {
  const { data } = await apiClient.delete(`/api/admin/coupons/${id}`);
  return data;
}
