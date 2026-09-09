// Centralised API client for authentication.
//
// Authentication is handled by Firebase Authentication (client + Admin SDK
// verification on the backend). This service sends the Firebase ID token to
// the backend, which verifies it and returns the REAL user profile/role from
// MongoDB.
//
// Registration is STEP-WISE and STATELESS:
//   1. signupUser(...)      — validate the payload & email a verification OTP.
//                              Nothing is created on Firebase or MongoDB yet;
//                              the backend returns a short-lived signed
//                              `verificationToken` (signup session).
//   2. verifyEmail(...)     — proves the OTP; ONLY then does the backend create
//                              the Firebase user + MongoDB profile (isVerified:
//                              true) and return a Firebase custom token.
//   3. signInWithSignupToken — finishes the session using that custom token.
// An unverified email leaves no record anywhere, so it can be signed up again.

import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  sendPasswordResetEmail,
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
 * Sign up a new user (STEP 1 of registration).
 * - Backend validates, emails a 6-digit OTP and returns a signed
 *   `verificationToken` — NO account (Firebase or MongoDB) is created yet and
 *   nothing is stored server-side, so the email can be used again if the OTP
 *   is never verified.
 * The role must be a public signup role; admin is never assignable through
 * signup (enforced on the backend too).
 */
export async function signupUser(data, setLoading) {
  try {
    if (setLoading) setLoading(true);

    const {
      name,
      email,
      password,
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
      name,
      email,
      password,
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

// ---------------------------------------------------------------------------
// Stateless signup session (verificationToken + email) kept in sessionStorage.
// The token is the ONLY thing that lets /verify-email and /resend-verification
// identify the pending signup — nothing exists on the server yet.
// ---------------------------------------------------------------------------
export const SIGNUP_TOKEN_KEY = "mamun_signup_token";
export const SIGNUP_EMAIL_KEY = "mamun_signup_email";

export function saveSignupSession({ email, verificationToken }) {
  try {
    if (verificationToken) sessionStorage.setItem(SIGNUP_TOKEN_KEY, verificationToken);
    if (email) sessionStorage.setItem(SIGNUP_EMAIL_KEY, email.toLowerCase());
  } catch {
    // sessionStorage unavailable — the token still travels via location state.
  }
}

export function readSignupSession() {
  try {
    return {
      email: String(sessionStorage.getItem(SIGNUP_EMAIL_KEY) || "").toLowerCase(),
      verificationToken: sessionStorage.getItem(SIGNUP_TOKEN_KEY) || "",
    };
  } catch {
    return { email: "", verificationToken: "" };
  }
}

export function clearSignupSession() {
  try {
    sessionStorage.removeItem(SIGNUP_TOKEN_KEY);
    sessionStorage.removeItem(SIGNUP_EMAIL_KEY);
  } catch {
    // best effort
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
 * Verify the user's email with the 6-digit OTP they received (STEP 2 of
 * registration). Requires the `verificationToken` from signup. ONLY on success
 * does the backend create the real account and return a Firebase custom token.
 * If the code was wrong, the backend re-signs the token (attempt counter) and
 * returns it in the error body so the UI can keep the session in sync.
 * @param {{ email: string, otp: string, verificationToken: string }} data
 */
export async function verifyEmail({ email, otp, verificationToken }) {
  try {
    const { data } = await apiClient.post("/api/auth/verify-email", {
      email,
      otp,
      verificationToken,
    });
    return data;
  } catch (err) {
    const e = new Error(errorMessage(err, "Verification failed."));
    e.verificationToken = err?.response?.data?.verificationToken || "";
    throw e;
  }
}

/**
 * Resend a fresh 6-digit OTP for the unverified signup (60-second cooldown).
 * Returns a NEW `verificationToken` that must replace the previous one.
 * The server's retryAfterMs (if any) is attached to the thrown error
 * so the UI can start an accurate countdown.
 * @param {{ email: string, verificationToken: string }} data
 */
export async function resendVerification({ email, verificationToken }) {
  try {
    const { data } = await apiClient.post(
      "/api/auth/resend-verification",
      { email, verificationToken },
    );
    return data;
  } catch (err) {
    const e = new Error(errorMessage(err, "Could not resend the code."));
    e.retryAfterMs = err?.response?.data?.retryAfterMs || 0;
    throw e;
  }
}

/**
 * Finish the registration session by signing in with the Firebase custom token
 * returned by /verify-email. This creates the Firebase auth session immediately
 * after the account is created, so the onAuthStateChanged listener can restore
 * the real profile via /api/auth/me.
 */
export async function signInWithSignupToken(customToken) {
  const credential = await signInWithCustomToken(auth, customToken);
  return credential.user;
}

/**
 * Send a password-reset email via Firebase Authentication.
 * Firebase sends the reset link directly (no SMTP credentials needed server-side).
 * @param {{ email: string }} data
 */
export async function resetPassword({ email }) {
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    return { success: true };
  } catch (err) {
    const map = {
      "auth/email-not-found": "No account found with this email.",
      "auth/user-not-found": "No account found with this email.",
      "auth/invalid-email": "Invalid email address.",
      "auth/missing-email": "Please enter your email address.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
    };
    throw new Error(map[err?.code] || "Could not send the reset link. Please try again.");
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
