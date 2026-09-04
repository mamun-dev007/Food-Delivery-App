// Public restaurant listing (real data from the backend/Database).
import { apiClient } from "./apiClient";

// Fetch all restaurants for the customer-facing Restaurants page.
export async function fetchRestaurants() {
  const { data } = await apiClient.get("/api/restaurants");
  return data.restaurants || [];
}

// Fetch a single restaurant by id (photo, name, etc.).
export async function fetchRestaurant(id) {
  const { data } = await apiClient.get(`/api/restaurants/${id}`);
  return data.restaurant || null;
}
