import { Router } from "express";
import { getDb } from "../db/mongo.js";
import { getAdmin } from "../config/firebaseAdmin.js";
import { getAuth } from "firebase-admin/auth";
import { verifyFirebaseToken } from "../middleware/auth.middleware.js";
import { createAdminNotification } from "../services/notification.service.js";
import { sendVerificationOtp } from "../services/mail.service.js";
import {
  OTP_TTL_MS,
  MAX_VERIFY_ATTEMPTS,
  isOtpValid,
  resendCooldown,
} from "../services/otp.service.js";
import {
  generateOtp,
  hashOtp,
  signSignupToken,
  verifySignupToken,
} from "../services/signupToken.service.js";

export const authRouter = Router();

const COLLECTION = "login";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    // Existing accounts created before email verification existed have no
    // isVerified field — treat them as verified so nothing breaks.
    isVerified: doc.isVerified !== false,
    theme:
      doc.theme === "dark" || doc.theme === "light" ? doc.theme : undefined,
  };
}

// ============================================================
// Signup helpers:
// createUserFromPending — builds the REAL MongoDB user (and restaurant for
// owner accounts) from an email-verified signup payload carried in the signed
// verification token. Called only after the user proves their address with the
// 6-digit OTP, so a login doc can NEVER exist without a verified email.
// createSignupNotification — role-based admin notification for a new account.
// ============================================================
async function createUserFromPending(pending) {
  const db = getDb();
  const login = db.collection(COLLECTION);
  const now = new Date();

  const doc = {
    uid: pending.uid,
    name: (pending.name || "").trim(),
    email: pending.email,
    role: pending.role,
    isVerified: true, // reached only after email OTP was confirmed
    status:
      pending.role === "restaurantOwner" || pending.role === "rider"
        ? "pending"
        : "active",
    phone: (pending.phone || "").trim(),
    address: {
      district: (pending.city || "").trim(),
      street: "",
      houseNo: "",
      full: (pending.deliveryAddress || "").trim(),
      area: (pending.area || "").trim(),
    },
    avatar_url: (pending.avatar_url || "").trim(),
    terms_accepted: true,
    terms_accepted_at: now,
    restaurant_id: null,
    vehicle_type: (pending.vehicleType || "").trim(),
    driving_license: (pending.drivingLicense || "").trim(),
    nid: (pending.nid || "").trim(),
    payment_method: (pending.paymentMethod || "").trim(),
    created_at: now,
    updated_at: now,
  };

  if (pending.role === "restaurantOwner") {
    const restaurants = db.collection("resturent-collection");
    const restaurant = {
      name: (pending.restaurantName || pending.name || "").trim(),
      logo_url: (pending.logo_url || "").trim(),
      cover_url: (pending.cover_url || "").trim(),
      owner_login_id: null, // linked during admin approval flow
      cuisine: (pending.cuisine || "").trim(),
      address: [pending.restaurantAddress, pending.city, pending.area]
        .filter(Boolean)
        .join(", "),
      phone: (pending.restaurantPhone || "").trim(),
      email: (pending.restaurantEmail || "").trim(),
      city: (pending.city || "").trim(),
      area: (pending.area || "").trim(),
      trade_license: (pending.tradeLicense || "").trim(),
      nid: (pending.nid || "").trim(),
      opening_time: (pending.openingTime || "").trim(),
      closing_time: (pending.closingTime || "").trim(),
      delivery_available: !!pending.deliveryAvailable,
      approval_state: "pending",
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
  return { userDoc: { ...doc, _id: result.insertedId }, name: doc.name };
}

async function createSignupNotification(pending, userDoc) {
  const notif = {
    customer: {
      type: "customer",
      title: "New customer registered",
      message: `${pending.name} created a customer account.`,
      navigateTo: "/admin/users",
    },
    restaurantOwner: {
      type: "restaurant",
      title: "New restaurant registration",
      message: `${pending.name} signed up to open ${
        pending.restaurantName || pending.name
      }. Awaiting verification.`,
      navigateTo: "/admin/restaurants/requests",
    },
    rider: {
      type: "rider",
      title: "New rider registration",
      message: `${pending.name} signed up as a rider. Awaiting verification.`,
      navigateTo: "/admin/riders/requests",
    },
  }[pending.role] || {
    type: "customer",
    title: "New user registered",
    message: `${pending.name} joined the platform.`,
    navigateTo: "/admin/users",
  };
  await createAdminNotification({
    type: notif.type,
    title: notif.title,
    message: notif.message,
    role: pending.role,
    userId: userDoc._id.toString(),
    userName: pending.name,
    relatedId: userDoc._id.toString(),
    relatedType: "user",
    navigateTo: notif.navigateTo,
    dedupeKey: `signup_${userDoc._id}`,
  });
}

// ============================================================
// POST /api/auth/signup
// Body: { name, email, password, role, termsAccepted, restaurantName?, ... }
//
// STEP 1 OF 2 for registration. The account is NOT created here and NOTHING is
// written to ANY database (no pending document, no user). We validate the
// payload, generate a 6-digit OTP and email it, then hand the client a
// short-lived signed verification token carrying the whole signup payload plus
// the bcrypt hash of the OTP. Because nothing is persisted, an unverified
// email leaves no record anywhere and can simply be used to sign up again.
//
// Only after that OTP is verified (POST /api/auth/verify-email) is the
// Firebase user + MongoDB login profile created. Unverified signups never
// become accounts.
// ============================================================
authRouter.post("/signup", async (req, res, next) => {
  try {
    const {
      name,
      email: rawEmail,
      password,
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

    const email = String(rawEmail || "").trim().toLowerCase();

    if (!name || !role) {
      return res
        .status(400)
        .json({ error: "name and role are required" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters." });
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

    const db = getDb();
    const login = db.collection(COLLECTION);

    // Unique email (indexed). Provide a clean 409 on collision.
    const existing = await login.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const now = new Date();

    // Everything needed to build the account LATER rides in the signed token.
    // The password is embedded so the Firebase user can be created only at
    // verification time — never before.
    const payload = {
      email,
      name: String(name).trim(),
      password,
      role,
      phone: String(phone || "").trim(),
      deliveryAddress: String(deliveryAddress || "").trim(),
      avatar_url: String(avatar_url || "").trim(),
      city: String(city || "").trim(),
      area: String(area || "").trim(),
      restaurantName: String(restaurantName || "").trim(),
      restaurantPhone: String(restaurantPhone || "").trim(),
      restaurantEmail: String(restaurantEmail || "").trim(),
      restaurantAddress: String(restaurantAddress || "").trim(),
      logo_url: String(logo_url || "").trim(),
      cover_url: String(cover_url || "").trim(),
      cuisine: String(cuisine || "").trim(),
      tradeLicense: String(tradeLicense || "").trim(),
      nid: String(nid || "").trim(),
      openingTime: String(openingTime || "").trim(),
      closingTime: String(closingTime || "").trim(),
      deliveryAvailable: !!deliveryAvailable,
      vehicleType: String(vehicleType || "").trim(),
      drivingLicense: String(drivingLicense || "").trim(),
      paymentMethod: String(paymentMethod || "").trim(),
      otpIssuedAt: now.getTime(),
    };

    const verificationToken = signSignupToken({ ...payload, otpHash });

    // Email the 6-digit verification OTP. If the email service is unavailable
    // the token stays valid; the user can resend the code from the verify page.
    let verificationEmailSent = false;
    try {
      await sendVerificationOtp({
        to: email,
        name: payload.name || "",
        otp,
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      });
      verificationEmailSent = true;
    } catch (e) {
      console.warn(
        "Signup: verification email could not be sent for",
        email,
        e.message,
      );
    }

    res.status(201).json({
      verificationToken,
      verificationEmailSent,
      expiresAt: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
      message:
        "A 6-digit verification code was sent to your email. Your account is created only after you verify it.",
    });
  } catch (err) {
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
// POST /api/auth/verify-email
// Body: { email, otp, verificationToken }
//
// STEP 2 OF 2 for registration. Verifies the 6-digit OTP against the hash
// embedded in the signed verification token (no database record exists yet).
// ONLY on success are the REAL account and (for owners) the restaurant
// created — the Firebase user here, then the MongoDB login doc, both marked
// isVerified: true. The Firebase account is created at this point and not at
// signup so an unverified email never leaves a Firebase account either and can
// simply be used to sign up again.
// ============================================================
authRouter.post("/verify-email", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const verificationToken = String(req.body.verificationToken || "").trim();

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "A valid email is required." });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res
        .status(400)
        .json({ error: "The verification code must be 6 digits." });
    }
    if (!verificationToken) {
      return res.status(400).json({
        error:
          "No verification session found. Please sign up again to receive a new code.",
        code: "SIGNUP_TOKEN_MISSING",
      });
    }

    let payload;
    try {
      payload = verifySignupToken(verificationToken);
    } catch (err) {
      return res.status(400).json({ error: err.message, code: err.code });
    }
    if (payload.email !== email) {
      return res.status(400).json({
        error:
          "This verification session does not match the email. Please sign up again.",
        code: "SIGNUP_TOKEN_INVALID",
      });
    }
    if ((payload.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
      return res.status(429).json({
        error: "Too many incorrect attempts. Please sign up again to get a new code.",
      });
    }

    const valid = await isOtpValid(otp, payload.otpHash);
    const attempts = (payload.attempts || 0) + 1;
    if (!valid) {
      if (attempts >= MAX_VERIFY_ATTEMPTS) {
        return res.status(429).json({
          error: "Too many incorrect attempts. Please sign up again to get a new code.",
        });
      }
      // Hand back a re-signed token so the attempt counter survives without
      // any storage; the client keeps it for the next retry.
      const retryToken = signSignupToken({ ...payload, attempts });
      return res.status(400).json({
        error: "Invalid verification code. Please try again.",
        attempts,
        verificationToken: retryToken,
      });
    }

    const db = getDb();
    const login = db.collection(COLLECTION);

    // Guard against double verification races (two tabs verifying at once).
    const already = await login.findOne({ email });
    if (already) {
      // The account already exists — just make sure this tab can still sign in.
      let customToken = "";
      try {
        if (already.uid) {
          customToken = await getAuth(await getAdmin()).createCustomToken(
            already.uid,
          );
        }
      } catch {
        // Non-fatal: the tab can use normal login instead.
      }
      return res.json({
        success: true,
        message: "Email verified successfully. Your account is created.",
        user: publicUser(already),
        customToken,
      });
    }

    // Verified — NOW create the real account. Firebase first so we have a uid
    // for the MongoDB doc. An orphaned Firebase user from an older flow is
    // adopted (password + verified flags set) instead of failing.
    const admin = await getAdmin();
    const firebaseAuth = getAuth(admin);
    let uid;
    try {
      const record = await firebaseAuth.createUser({
        email,
        password: payload.password,
        displayName: payload.name || "",
        emailVerified: true,
      });
      uid = record.uid;
    } catch (e) {
      if (e?.code === "auth/email-already-in-use") {
        const orphan = await firebaseAuth.getUserByEmail(email);
        await firebaseAuth.updateUser(orphan.uid, {
          password: payload.password,
          displayName: payload.name || "",
          emailVerified: true,
        });
        uid = orphan.uid;
      } else {
        throw e;
      }
    }

    const { userDoc } = await createUserFromPending({ ...payload, uid });

    // Role-based admin notification for the new registration.
    try {
      await createSignupNotification(payload, userDoc);
    } catch (e) {
      console.warn("Failed to create admin notification:", e.message);
    }

    // A Firebase custom token lets this client finish the session in one shot.
    const customToken = await firebaseAuth.createCustomToken(uid);

    res.json({
      success: true,
      message: "Email verified successfully. Your account is created.",
      user: publicUser(userDoc),
      customToken,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/auth/resend-verification
// Body: { email, verificationToken }
//
// Issues a fresh 6-digit OTP for the UNVERIFIED signup, invalidating the
// previous code by returning a NEW signed token. The 60-second cooldown is
// derived from the token's otpIssuedAt claim — no storage involved.
// ============================================================
authRouter.post("/resend-verification", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const verificationToken = String(req.body.verificationToken || "").trim();

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "A valid email is required." });
    }
    if (!verificationToken) {
      return res.status(400).json({
        error:
          "No verification session found. Please sign up again to receive a new code.",
        code: "SIGNUP_TOKEN_MISSING",
      });
    }

    let payload;
    try {
      payload = verifySignupToken(verificationToken);
    } catch (err) {
      return res.status(400).json({ error: err.message, code: err.code });
    }
    if (payload.email !== email) {
      return res.status(400).json({
        error:
          "This verification session does not match the email. Please sign up again.",
        code: "SIGNUP_TOKEN_INVALID",
      });
    }

    const { allowed, retryAfterMs } = resendCooldown(
      payload.otpIssuedAt ? new Date(payload.otpIssuedAt) : null,
    );
    if (!allowed) {
      return res.status(429).json({
        error: "Please wait before requesting another code.",
        retryAfterMs,
      });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const now = new Date();
    const newToken = signSignupToken({
      ...payload,
      otpHash,
      attempts: 0,
      otpIssuedAt: now.getTime(),
    });

    try {
      await sendVerificationOtp({
        to: email,
        name: payload.name || "",
        otp,
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      });
    } catch (err) {
      // Do not reveal SMTP internals — just a friendly retryable message.
      console.warn("Failed to send verification email:", err?.message);
      return res.status(500).json({
        error: "We couldn't send the email right now. Please try again later.",
      });
    }

    res.json({
      success: true,
      message: "Verification code sent.",
      verificationToken: newToken,
      expiresAt: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
      retryAfterMs,
    });
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
