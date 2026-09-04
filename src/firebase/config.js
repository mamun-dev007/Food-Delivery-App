// Firebase Web client configuration.
// These values come from Firebase Console → Project Settings → Your apps.
// NOTE: Web config keys are intentionally client-safe (they are not secrets).

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// If any required key is missing, throw a clear error at startup rather than
// failing silently later with a confusing auth error.
const REQUIRED_KEYS = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missing = REQUIRED_KEYS.filter((k) => !firebaseConfig[k]);
if (missing.length) {
  throw new Error(
    `Firebase web config is incomplete. Missing: ${missing.join(", ")}. ` +
      "Set the VITE_FIREBASE_* variables in a .env file in the project root."
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
