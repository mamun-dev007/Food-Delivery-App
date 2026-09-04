// Firebase Admin SDK initialisation.
//
// The Admin SDK is used to VERIFY Firebase ID tokens on the server so that
// we never trust a role/email sent by the client. Real authorization is
// decided here after validating the Firebase token + reading the MongoDB role.
//
// Credentials can be supplied two ways (set one of them in backend/.env):
//
//   1. FIREBASE_SERVICE_ACCOUNT  - the full service-account JSON as a string
//   2. FIREBASE_SERVICE_ACCOUNT_PATH - path to a service-account JSON file
//
// Prefer option 2 in production (keep the file out of the repo).

import { readFileSync } from "node:fs";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";

let adminApp = null;

function loadServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (json) {
    try {
      return JSON.parse(json);
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT is not valid JSON: " + err.message
      );
    }
  }

  if (path) {
    const raw = readFileSync(path, "utf8");
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_PATH (${path}) is not valid JSON: ` +
          err.message
      );
    }
  }

  return null;
}

async function getAdminApp() {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    // No credentials configured. This is a hard failure for any protected
    // request, so surface immediately instead of failing per-request.
    throw new Error(
      "Firebase Admin SDK is not configured. Set FIREBASE_SERVICE_ACCOUNT " +
        "or FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env"
    );
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount),
  });

  return adminApp;
}

/**
 * Returns a promise that resolves once the Admin app is ready.
 * Call this from the server entrypoint (index.js) so startup fails loudly
 * if Firebase Admin is misconfigured.
 */
export async function initFirebaseAdmin() {
  await getAdminApp();
}

/** Lazily get the Firebase Admin app instance. */
export async function getAdmin() {
  return getAdminApp();
}
