// Reviews API client.
//   fetchReviews   -> public, all customers can read
//   submitReview   -> logged-in customer only (attaches Firebase token)

import axios from "axios";
import { apiClient, API_URL } from "./apiClient";

/** Fetch reviews (newest first). Optionally filter to one dish. Public — no auth needed. */
export async function fetchReviews(dish) {
  const params = {};
  if (dish) params.dish = dish;
  const { data } = await axios.get(`${API_URL}/api/reviews`, { params });
  return data.reviews || [];
}

/** Submit a review as the logged-in customer. */
export async function submitReview({ dish, rating, text }) {
  const { data } = await apiClient.post("/api/reviews", { dish, rating, text });
  return data.review;
}
