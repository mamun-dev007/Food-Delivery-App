// Food catalogue API client.
// Fetches foods from the backend only — real MongoDB data, no static fallback.

import { apiClient } from "./apiClient";

/**
 * Fetch all foods (optionally filtered by restaurant).
 * Returns foods in DB shape.
 */
export async function fetchFoods(restaurantId) {
  const params = {};
  if (restaurantId) params.restaurant_id = restaurantId;
  const { data } = await apiClient.get("/api/food", { params });
  return data.foods || [];
}

/**
 * Fetch a single food by id from the backend.
 */
export async function fetchFoodById(id) {
  const { data } = await apiClient.get(`/api/food/${id}`);
  return data.food || null;
}

/**
 * Fetch the list of food categories with item counts.
 */
export async function fetchFoodCategories() {
  const { data } = await apiClient.get("/api/food/categories");
  return data.categories || [];
}

/**
 * Fetch the most popular foods based on actual order counts.
 * Returns up to `limit` foods sorted by most-ordered first.
 */
export async function fetchPopularFoods(limit = 4) {
  try {
    const { data } = await apiClient.get("/api/food/popular", {
      timeout: 4000,
    });
    const list = data.foods || [];

    return list.slice(0, limit).map((f) => ({
      id: f.id || f.food_id,
      name: f.name || f.food_name,
      category: f.category || "Other",
      price: f.price || 0,
      rating: f.rating != null ? f.rating : 0,
      image: f.image || "",
      restaurant: {
        id: f.restaurant_id,
        name: f.restaurant_name,
        logo: f.restaurant_logo,
      },
    }));
  } catch (err) {
    console.warn("Could not load popular foods:", err.message);
    return [];
  }
}

/**
 * Fetch the logged-in restaurant owner's own foods.
 */
export async function fetchMyFoods() {
  const { data } = await apiClient.get("/api/owner/food");
  return data.foods || [];
}

/**
 * Create a new food for the logged-in restaurant owner.
 */
export async function createFood(payload) {
  const { data } = await apiClient.post("/api/owner/food", payload);
  return data.food;
}

/**
 * Update an existing food for the logged-in restaurant owner.
 */
export async function updateFood(id, payload) {
  const { data } = await apiClient.put(`/api/owner/food/${id}`, payload);
  return data.food;
}

/**
 * Delete a food for the logged-in restaurant owner.
 */
export async function deleteFood(id) {
  await apiClient.delete(`/api/owner/food/${id}`);
}
