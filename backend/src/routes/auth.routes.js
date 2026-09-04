import { Router } from "express";
import { getDb } from "../db/mongo.js";
import { getAdmin } from "../config/firebaseAdmin.js";
import { getAuth } from "firebase-admin/auth";
import { verifyFirebaseToken } from "../middleware/auth.middleware.js";
import { createAdminNotification } from "../services/notification.service.js";

export const authRouter = Router();

const COLLECTION = "login";

// Allowed roles stored in MongoDB. NEVER trust a role sent by the client —
// these are the only valid values.
const VALID_ROLES = ["customer", "restaurantOwner", "rider", "admin"];

// Valid account status values.
// active = fully usable; pending/rejected = restaurant-owner verification
// states (they may log in but the dashboard is gated); inactive/blocked are
// always disallowed.
const VALID_STATUS = ["active", "pending", "rejected", "inactive", "blocked"];

// Which roles can be created through public signup. Admin is intentionally
// excluded — admin accounts are created only via controlled setup scripts.
const PUBLIC_SIGNUP_ROLES = ["customer", "restaurantOwner", "rider"];

async function verifyIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    const err = new Error("Authentication failed. Please login again.");
    err.status = 401;
    throw err;
  }
  const admin = await getAdmin();
  try {
    return await getAuth(admin).verifyIdToken(idToken);
  } catch {
    const err = new Error("Authentication failed. Please login again.");
    err.status = 401;
    throw err;
  }
}

// Strip sensitive fields before sending a user to the client.
function publicUser(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name || "",
    email: doc.email || "",
    role: doc.role,
    status: doc.status || "active",
    phone: doc.phone || "",
    address: doc.address || {},
    avatar_url: doc.avatar_url || "",
    terms_accepted: !!doc.terms_accepted,
    restaurant_id: doc.restaurant_id ? doc.restaurant_id.toString() : null,
    vehicle_type: doc.vehicle_type || "",
    driving_license: doc.driving_license || "",
    nid: doc.nid || "",
    payment_method: doc.payment_method || "",
    approved_at: doc.approved_at || null,
    reviewed_at: doc.reviewed_at || null,
    theme:
      doc.theme === "dark" || doc.theme === "light" ? doc.theme : undefined,
  };
}

// ============================================================
// POST /api/auth/signup
// Body: { idToken, name, email, role, restaurantName?, phone?, ... }
// The role is assigned ONLY if it is a public signup role. Admin is always
// rejected here (403). Accounts are created in Firebase first (handled on
// the client), then we verify the token and create the MongoDB profile.
// ============================================================
authRouter.post("/signup", async (req, res, next) => {
  try {
    const {
      idToken,
      name,
      role,
      phone = "",
      deliveryAddress = "",
      avatar_url = "",
      termsAccepted = false,

      // Restaurant-owner specific fields (only used when role === "restaurantOwner")
      restaurantName = "",
      restaurantPhone = "",
      restaurantEmail = "",
      restaurantAddress = "",
      city = "",
      area = "",
      logo_url = "",
      cover_url = "",
      cuisine = "",
      tradeLicense = "",
      nid = "",
      openingTime = "",
      closingTime = "",
      deliveryAvailable = false,

      // Rider specific fields (only used when role === "rider")
      vehicleType = "",
      drivingLicense = "",
      paymentMethod = "",
    } = req.body;

    if (!name || !role) {
      return res
        .status(400)
        .json({ error: "name and role are required" });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (!PUBLIC_SIGNUP_ROLES.includes(role)) {
      // e.g. trying to sign up as admin
      return res
        .status(403)
        .json({ error: "You cannot sign up as an Admin." });
    }
    if (!termsAccepted) {
      return res
        .status(400)
        .json({ error: "You must agree to the Terms & Conditions." });
    }

    // Verify the Firebase token to confirm this identity actually exists.
    const decoded = await verifyIdToken(idToken);
    const email = (decoded.email || req.body.email || "").toLowerCase().trim();
    const uid = decoded.uid;

    if (!email) {
      return res.status(400).json({ error: "A valid email is required" });
    }

    const db = getDb();
    const login = db.collection(COLLECTION);

    // Unique email (indexed). Provide a clean 409 on collision.
    const existing = await login.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }

    const now = new Date();
    const doc = {
      uid, // Firebase uid — the strong link to the verified identity
      name: name.trim(),
      email,
      role,
      // Restaurant-owner and rider accounts start in "pending" verification and
      // become "active" only after an admin approves them. Others start active.
      status:
        role === "restaurantOwner" || role === "rider" ? "pending" : "active",
      phone: phone.trim(),
      address: {
        district: (city || "").trim(),
        street: "",
        houseNo: "",
        full: deliveryAddress.trim(),
        area: (area || "").trim(),
      },
      avatar_url: avatar_url.trim(),
      terms_accepted: true,
      terms_accepted_at: now,
      restaurant_id: null,
      // Rider profile fields (only populated when role === "rider")
      vehicle_type: vehicleType.trim(),
      driving_license: drivingLicense.trim(),
      nid: nid.trim(),
      payment_method: paymentMethod.trim(),
      created_at: now,
      updated_at: now,
    };

    // For restaurant-owner signup, also create a restaurant so the owner has
    // a business record to manage. Its approval_state mirrors the owner status.
    if (role === "restaurantOwner") {
      const restaurants = db.collection("resturent-collection");
      const restaurant = {
        name: (restaurantName || name).trim(),
        logo_url: logo_url.trim(),
        cover_url: cover_url.trim(),
        owner_login_id: null, // set after inserting the user
        cuisine: cuisine.trim(),
        address: [restaurantAddress, city, area]
          .filter(Boolean)
          .join(", "),
        phone: restaurantPhone.trim(),
        email: restaurantEmail.trim(),
        city: (city || "").trim(),
        area: (area || "").trim(),
        trade_license: tradeLicense.trim(),
        nid: nid.trim(),
        opening_time: openingTime.trim(),
        closing_time: closingTime.trim(),
        delivery_available: !!deliveryAvailable,
        approval_state: "pending", // pending | approved | rejected
        is_open: false,
        rating: 0,
        delivery_charge: 0,
        min_order: 0,
        created_at: now,
      };
      const r = await restaurants.insertOne(restaurant);
      doc.restaurant_id = r.insertedId;
    }

    const result = await login.insertOne(doc);
    const userDoc = { ...doc, _id: result.insertedId };

    // Role-based admin notification for the new registration.
    try {
      const notif = {
        customer: {
          type: "customer",
          title: "New customer registered",
          message: `${doc.name} created a customer account.`,
          navigateTo: "/admin/users",
        },
        restaurantOwner: {
          type: "restaurant",
          title: "New restaurant registration",
          message: `${doc.name} signed up to open ${
            restaurantName || doc.name
          }. Awaiting verification.`,
          navigateTo: "/admin/restaurants/requests",
        },
        rider: {
          type: "rider",
          title: "New rider registration",
          message: `${doc.name} signed up as a rider. Awaiting verification.`,
          navigateTo: "/admin/riders/requests",
        },
      }[role] || {
        type: "customer",
        title: "New user registered",
        message: `${doc.name} joined the platform.`,
        navigateTo: "/admin/users",
      };
      await createAdminNotification({
        type: notif.type,
        title: notif.title,
        message: notif.message,
        role,
        userId: result.insertedId.toString(),
        userName: doc.name,
        relatedId: result.insertedId.toString(),
        relatedType: "user",
        navigateTo: notif.navigateTo,
        dedupeKey: `signup_${result.insertedId}`,
      });
    } catch (e) {
      console.warn("Failed to create admin notification:", e.message);
    }

    res.status(201).json({ token: idToken, user: publicUser(userDoc) });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }
    next(err);
  }
});

// ============================================================
// POST /api/auth/login
// Body: { idToken, email, role }
//
// Verifies the Firebase token, loads the REAL role/status from MongoDB, and
// ensures the account role matches the portal the user chose. This blocks a
// user of one role from logging in through another role's portal.
// ============================================================
authRouter.post("/login", async (req, res, next) => {
  try {
    const { idToken, role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "A valid role is required to login" });
    }

    // Verify the token and get the verified Firebase identity.
    const decoded = await verifyIdToken(idToken);
    const email = (decoded.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(401).json({ error: "User account not found." });
    }

    const db = getDb();
    const login = db.collection(COLLECTION);

    const doc = await login.findOne({
      $or: [{ email }, { uid: decoded.uid }],
    });
    if (!doc) {
      return res.status(404).json({ error: "User account not found." });
    }

    // Status checks. Restaurant owners in "pending"/"rejected" verification
    // ARE allowed to log in so they can see the pending/verification notice;
    // the dashboard itself remains gated until approval. "inactive"/"blocked"
    // accounts are always rejected regardless of role.
    if (doc.status === "blocked") {
      return res.status(403).json({
        error: "Your account has been blocked. Please contact support.",
      });
    }
    if (doc.status === "inactive") {
      return res.status(403).json({ error: "Your account is inactive." });
    }

    // Role must match the portal the user selected.
    if (doc.role !== role) {
      const label = (role.charAt(0).toUpperCase() + role.slice(1)).replace(
        "restaurantOwner",
        "Restaurant Owner"
      );
      return res.status(403).json({
        error: `You are not authorized to login as ${label}.`,
      });
    }

    res.json({ token: idToken, user: publicUser(doc) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/auth/resolve-email
// Body: { identifier }  (email or phone)
//
// Used by the customer login page ("Email / Phone"). If the identifier looks
// like a phone number, look it up in MongoDB and return the account email so
// the client can sign in with Firebase. If it already contains an '@', the
// identifier is returned unchanged. No account info is leaked — only an email
// is returned for an exact phone match.
// ============================================================
authRouter.post("/resolve-email", async (req, res, next) => {
  try {
    const identifier = String(req.body.identifier || "")
      .trim()
      .toLowerCase();

    if (!identifier) {
      return res.status(400).json({ error: "Please enter your email or phone." });
    }

    // Looks like an email already -> use as-is.
    if (identifier.includes("@")) {
      return res.json({ email: identifier });
    }

    // Otherwise treat it as a phone number and look it up.
    const db = getDb();
    const login = db.collection(COLLECTION);
    const doc = await login
      .findOne({ phone: identifier }, { projection: { email: 1 } });

    if (!doc || !doc.email) {
      return res.status(404).json({
        error: "No account found with this email or phone.",
      });
    }

    res.json({ email: doc.email.toLowerCase() });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/auth/me
// Requires a valid Firebase token. Returns the authenticated user's real
// profile + role from MongoDB. Used by the frontend to restore a session.
// ============================================================
authRouter.get("/me", verifyFirebaseToken, async (req, res, next) => {
  try {
    const db = getDb();
    const login = db.collection(COLLECTION);
    const email = (req.user.email || "").toLowerCase().trim();

    const doc = await login.findOne({
      $or: [{ email }, { uid: req.user.uid }],
    });
    if (!doc) {
      return res.status(404).json({ error: "User account not found." });
    }
    if (doc.status === "blocked") {
      return res.status(403).json({
        error: "Your account has been blocked. Please contact support.",
      });
    }
    if (doc.status === "inactive") {
      return res.status(403).json({ error: "Your account is inactive." });
    }

    res.json({ success: true, user: publicUser(doc) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /api/auth/profile
// Requires a valid Firebase token. Updates the user's profile
// (name, avatar_url, phone, theme). Theme is persisted per-user
// in the database so each account keeps its own dark/light
// preference.
// ============================================================
authRouter.patch("/profile", verifyFirebaseToken, async (req, res, next) => {
  try {
    const { name, avatar_url, phone, theme } = req.body;
    const db = getDb();
    const login = db.collection(COLLECTION);
    const email = (req.user.email || "").toLowerCase().trim();

    const doc = await login.findOne({
      $or: [{ email }, { uid: req.user.uid }],
    });
    if (!doc) {
      return res.status(404).json({ error: "User account not found." });
    }

    const updateFields = { updated_at: new Date() };
    if (name !== undefined) updateFields.name = String(name).trim();
    if (avatar_url !== undefined) updateFields.avatar_url = avatar_url.trim();
    if (phone !== undefined) updateFields.phone = String(phone).trim();
    if (theme !== undefined) {
      if (theme !== "light" && theme !== "dark") {
        return res
          .status(400)
          .json({ error: 'Theme must be either "light" or "dark".' });
      }
      updateFields.theme = theme;
    }

    await login.updateOne({ _id: doc._id }, { $set: updateFields });

    const updated = await login.findOne({ _id: doc._id });
    res.json({ success: true, user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
});
