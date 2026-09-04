import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo.js";
import { verifyRole } from "../middleware/auth.middleware.js";

// ============================================================
// Coupons (MongoDB-backed).
//
//   Public router (publicCouponRouter) : GET /        -> list active coupons
//                                         POST /validate -> validate a code
//   Admin router (adminCouponRouter)   : GET/POST/DELETE management
//
// The admin router is mounted under verifyRole("admin").
// Coupons are stored in the "coupons" collection with:
//   code, type ("Percentage" | "Flat Amount" | "Free Delivery"),
//   value, usage, max_usage (0 = unlimited), expires, active
// ============================================================

export const publicCouponRouter = Router();
export const adminCouponRouter = Router();
adminCouponRouter.use(verifyRole("admin"));

const COUPONS = "coupons";

function toPublic(d) {
  return {
    id: d._id.toString(),
    code: d.code,
    type: d.type,
    value: d.value,
    usage: d.usage || 0,
    max_usage: d.max_usage || 0,
    expires: d.expires || null,
    description: d.description || "",
    active: d.active != null ? d.active : true,
  };
}

function isExpired(d, now = new Date()) {
  if (!d.expires) return false;
  const exp = new Date(d.expires);
  return !Number.isNaN(exp.getTime()) && exp < now;
}

// ============================================================
// PUBLIC  GET /api/coupons
// Returns all active, non-expired coupons for the Offers page.
// ============================================================
publicCouponRouter.get("/", async (req, res, next) => {
  try {
    const db = getDb();
    const docs = await db.collection(COUPONS).find({ active: true }).toArray();
    const now = new Date();
    const activeCoupons = docs.filter((d) => !isExpired(d, now));
    res.json({ success: true, coupons: activeCoupons.map(toPublic) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PUBLIC  POST /api/coupons/validate
// Body: { code, subtotal }
// Validates a coupon and returns the discount amount to apply.
// ============================================================
publicCouponRouter.post("/validate", async (req, res, next) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    const subtotal = Math.max(0, Number(req.body.subtotal) || 0);

    if (!code) {
      return res.status(400).json({ error: "Please enter a coupon code." });
    }

    const db = getDb();
    const doc = await db.collection(COUPONS).findOne({ code, active: true });
    if (!doc) {
      return res.status(404).json({ error: "Invalid coupon code." });
    }
    if (isExpired(doc)) {
      return res.status(400).json({ error: "This coupon has expired." });
    }
    if (doc.max_usage && doc.usage >= doc.max_usage) {
      return res.status(400).json({ error: "This coupon has reached its usage limit." });
    }

    let discount = 0;
    let type = doc.type;
    let value = doc.value || 0;

    if (type === "Percentage") {
      discount = Math.round((subtotal * value) / 100 * 100) / 100;
    } else if (type === "Flat Amount") {
      discount = Math.min(value, subtotal);
    } else if (type === "Free Delivery") {
      type = "Free Delivery";
      value = 0;
      discount = 0;
    }

    res.json({
      success: true,
      coupon: {
        code: doc.code,
        type,
        value,
        discount: Math.round(discount * 100) / 100,
        description: doc.description || "",
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// ADMIN  GET /api/admin/coupons
// ============================================================
adminCouponRouter.get("/", async (req, res, next) => {
  try {
    const docs = await getDb().collection(COUPONS).find({}).toArray();
    res.json({ success: true, coupons: docs.map(toPublic) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// ADMIN  POST /api/admin/coupons
// Body: { code, type, value, max_usage, expires, description }
// ============================================================
adminCouponRouter.post("/", async (req, res, next) => {
  try {
    const {
      code,
      type = "Percentage",
      value = 0,
      max_usage = 0,
      expires = null,
      description = "",
    } = req.body;

    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanCode) {
      return res.status(400).json({ error: "Coupon code is required." });
    }
    if (!["Percentage", "Flat Amount", "Free Delivery"].includes(type)) {
      return res.status(400).json({ error: "Invalid coupon type." });
    }

    const db = getDb();
    const existing = await db.collection(COUPONS).findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({ error: "Coupon code already exists." });
    }

    const now = new Date();
    const doc = {
      code: cleanCode,
      type,
      value: Math.max(0, Number(value) || 0),
      usage: 0,
      max_usage: Math.max(0, Math.floor(Number(max_usage) || 0)),
      expires: expires ? new Date(expires) : null,
      description: String(description || "").trim(),
      active: true,
      created_at: now,
    };

    const result = await db.collection(COUPONS).insertOne(doc);
    res.status(201).json({ success: true, coupon: toPublic({ ...doc, _id: result.insertedId }) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// ADMIN  DELETE /api/admin/coupons/:id
// ============================================================
adminCouponRouter.delete("/:id", async (req, res, next) => {
  try {
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: "Invalid coupon id" });
    }
    const result = await getDb().collection(COUPONS).deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Coupon not found." });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
