// Centralised API client for authentication.
//
// Authentication is handled by Firebase Authentication (client + Admin SDK
// verification on the backend). This service sends the Firebase ID token to
// the backend, which verifies it and returns the REAL user profile/role from
// MongoDB.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getAuth,
} from "firebase/auth";
import { app } from "../firebase/config";
import { apiClient } from "./apiClient";

const auth = getAuth(app);

/**
 * Translate a backend / Firebase error into a clean message string.
 */
function errorMessage(err, fallback) {
  const msg = err?.response?.data?.error;
  if (typeof msg === "string" && msg) return msg;
  if (err?.code) {
    const map = {
      "auth/invalid-email": "Invalid email address.",
      "auth/user-not-found": "Invalid email or password.",
      "auth/wrong-password": "Invalid email or password.",
      "auth/invalid-credential": "Invalid email or password.",
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
    };
    if (map[err.code]) return map[err.code];
  }
  return fallback || "Something went wrong.";
}

/**
 * Sign up a new user.
 * - Creates the account in Firebase Authentication.
 * - Sends the ID token + role/details to the backend, which stores the user
 *   in MongoDB and assigns the role.
 * The role must be a public signup role; admin is never assignable through
 * signup (enforced on the backend too).
 */
export async function signupUser(data, setLoading) {
  try {
    if (setLoading) setLoading(true);

    const credential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    const idToken = await credential.user.getIdToken();

    const {
      name,
      role,
      phone,
      deliveryAddress,
      avatar_url,
      termsAccepted,
      restaurantName,
      restaurantPhone,
      restaurantEmail,
      restaurantAddress,
      city,
      area,
      logo_url,
      cover_url,
      cuisine,
      tradeLicense,
      nid,
      openingTime,
      closingTime,
      deliveryAvailable,
      vehicleType,
      drivingLicense,
      paymentMethod,
    } = data;
    const { data: res } = await apiClient.post("/api/auth/signup", {
      idToken,
      name,
      email: data.email,
      role,
      phone,
      deliveryAddress,
      avatar_url,
      termsAccepted,
      restaurantName,
      restaurantPhone,
      restaurantEmail,
      restaurantAddress,
      city,
      area,
      logo_url,
      cover_url,
      cuisine,
      tradeLicense,
      nid,
      openingTime,
      closingTime,
      deliveryAvailable,
      vehicleType,
      drivingLicense,
      paymentMethod,
    });
    return res;
  } catch (err) {
    throw new Error(errorMessage(err));
  } finally {
    if (setLoading) setLoading(false);
  }
}

/**
 * Authenticate an existing user for a specific role portal.
 *
 * 1. Firebase verifies email/password -> ID token.
 * 2. Backend verifies the ID token, looks up the user in MongoDB and checks
 *    that the REAL stored role matches the requested `role`.
 * 3. Returns the user profile (with the real role) + the ID token.
 */
export async function loginUser(data, setLoading) {
  try {
    if (setLoading) setLoading(true);

    // "Email / Phone" login: resolve a phone number to the account email
    // before signing in with Firebase (which requires an email address).
    let email = String(data.email || "").trim().toLowerCase();
    if (email && !email.includes("@")) {
      const { data: resolved } = await apiClient.post("/api/auth/resolve-email", {
        identifier: email,
      });
      email = resolved.email;
    }

    const credential = await signInWithEmailAndPassword(auth, email, data.password);
    const idToken = await credential.user.getIdToken();

    const { data: res } = await apiClient.post("/api/auth/login", {
      idToken,
      email,
      role: data.role,
    });
    return res;
  } catch (err) {
    // The backend only rejects login here for a role/account mismatch (403)
    // while Firebase already signed the user in. We must undo that Firebase
    // sign-in so onAuthStateChanged does NOT restore a session afterwards
    // (which would otherwise log the user in despite the role rejection).
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      try {
        await signOut(auth);
      } catch {
        // Best-effort; still surface the original error.
      }
    }
    throw new Error(errorMessage(err));
  } finally {
    if (setLoading) setLoading(false);
  }
}

/**
 * Load the authenticated user's real profile + role from the backend.
 * Uses the current Firebase ID token (attached by the apiClient interceptor).
 */
export async function getMe() {
  const { data } = await apiClient.get("/api/auth/me");
  return data;
}

/**
 * Update the authenticated user's profile (name, avatar_url, phone, theme).
 * Returns the updated user from the backend.
 */
export async function updateProfile({ name, avatar_url, phone, theme }) {
  try {
    const { data } = await apiClient.patch("/api/auth/profile", { name, avatar_url, phone, theme });
    return data;
  } catch (err) {
    throw new Error(errorMessage(err, "Failed to update profile."));
  }
}

/**
 * Sign out from Firebase.
 */
export async function logoutFirebase() {
  await signOut(auth);
}

// localStorage keys shared with the auth store (used to persist the session).
export const AUTH_TOKEN_KEY = "mamun_auth_token";
export const AUTH_USER_KEY = "mamun_auth_user";
