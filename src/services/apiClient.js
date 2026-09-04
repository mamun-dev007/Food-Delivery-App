// Shared axios client that automatically attaches the current Firebase ID
// token (if signed in) to every request as:  Authorization: Bearer <token>

import axios from "axios";
import { getAuth } from "firebase/auth";
import { app } from "../firebase/config";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const auth = getAuth(app);

apiClient.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No session — protected calls will simply get a 401.
  }
  return config;
});
