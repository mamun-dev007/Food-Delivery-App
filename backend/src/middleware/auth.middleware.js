// Backend authorization middleware.
//
// Security model:
//   1. verifyFirebaseToken  – validate the Firebase ID token from the
//                             Authorization header and attach the verified
//                             Firebase user to req.user.
//   2. verifyRole(...roles) – on top of token verification, loads the REAL
//                             role from MongoDB (never trust the client) and
//                             rejects requests whose role is not allowed.
//
// Neither middleware ever trusts req.body.role / URL role / query role.

import { getAdmin } from "../config/firebaseAdmin.js";
import { getDb } from "../db/mongo.js";
import { getAuth } from "firebase-admin/auth";

// ---------------------------------------------------------------------------
// verifyFirebaseToken
// ---------------------------------------------------------------------------
//   Authorization: Bearer <firebase-id-token>
//
// Validates the token with the Firebase Admin SDK and attaches the decoded
// user to req.user ({ uid, email, name, ... }).
// ---------------------------------------------------------------------------
export async function verifyFirebaseToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res
        .status(401)
        .json({ error: "Authentication failed. Please login again." });
    }

    const admin = await getAdmin();
    const decoded = await getAuth(admin).verifyIdToken(token);

    // Required for a production app per Firebase docs.
    if (new Date(decoded.exp * 1000) < new Date()) {
      return res
        .status(401)
        .json({ error: "Authentication failed. Please login again." });
    }

    req.user = {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase(),
      name: decoded.name || "",
    };

    next();
  } catch (err) {
    // Any verification failure (expired, invalid, malformed) -> 401.
    return res
      .status(401)
      .json({ error: "Authentication failed. Please login again." });
  }
}

// ---------------------------------------------------------------------------
// verifyRole(...allowedRoles)
// ---------------------------------------------------------------------------
//   verifyRole("admin")
//   verifyRole("customer", "rider")
//
// Used AFTER verifyFirebaseToken. Looks up the user in MongoDB using the
// verified Firebase email/uid, checks status, reads the REAL stored role,
// and rejects if it is not in the allowed set (HTTP 403).
// ---------------------------------------------------------------------------
export const verifyRole =
  (...allowedRoles) =>
  async (req, res, next) => {
    try {
      // Verify the token first if it hasn't been done already.
      if (!req.user) {
        const header = req.headers.authorization || "";
        const [scheme, token] = header.split(" ");
        if (scheme !== "Bearer" || !token) {
          return res
            .status(401)
            .json({ error: "Authentication failed. Please login again." });
        }
        const admin = await getAdmin();
        try {
          const decoded = await getAuth(admin).verifyIdToken(token);
          req.user = {
            uid: decoded.uid,
            email: (decoded.email || "").toLowerCase(),
            name: decoded.name || "",
          };
        } catch {
          return res
            .status(401)
            .json({ error: "Authentication failed. Please login again." });
        }
      }

      const db = getDb();
      const login = db.collection("login");

      // Find the account by email (the existing login collection uses email
      // as the natural key and it is unique-indexed).
      const user =
        (req.user.email &&
          (await login.findOne({ email: req.user.email }))) ||
        null;

      if (!user) {
        return res
          .status(404)
          .json({ error: "User account not found." });
      }

      // Status checks.
      if (user.status === "blocked") {
        return res.status(403).json({
          error: "Your account has been blocked. Please contact support.",
        });
      }
      if (user.status === "inactive") {
        return res.status(403).json({ error: "Your account is inactive." });
      }

      // Email verification gate. Only accounts explicitly created as
      // isVerified: false are blocked — pre-existing accounts (no field) keep
      // working exactly as before.
      if (user.isVerified === false) {
        return res.status(403).json({
          error: "Please verify your email address to continue.",
          code: "EMAIL_NOT_VERIFIED",
        });
      }

      const role = user.role;
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          error: "You do not have permission to access this resource.",
        });
      }

      // Attach the MongoDB user (with the REAL role) for downstream handlers.
      req.userData = {
        id: user._id.toString(),
        uid: req.user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        restaurant_id: user.restaurant_id
          ? user.restaurant_id.toString()
          : null,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
