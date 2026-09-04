import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo.js";

// ============================================================
// Customer dashboard routes (additive — reuses the existing
// order-summary / login collections, no schema changes).
//
//   GET  /api/customer/notifications       -> real, order-derived feed
//   POST /api/customer/notifications/read  -> mark all as read
//
// Every route is mounted under verifyRole("customer"), so
// req.userData.id is the REAL MongoDB user id from the verified
// Firebase identity — never trusted from the client.
// ============================================================

export const customerRouter = Router();

const ORDER_COLLECTION = "order-summary";
const LOGIN_COLLECTION = "login";

const ACTIVE_STATUSES = ["Pending", "Preparing", "On The Way"];

/** Build a customer notification from a real order doc. */
function notificationFromOrder(d, type, title, message) {
  return {
    type,
    title,
    message,
    relatedId: d.order_no || String(d._id || ""),
    navigateTo: "/customer/dashboard/my-orders",
    time: d.updated_at || d.created_at,
  };
}

// ============================================================
// GET /api/customer/notifications
// ============================================================
// Real, per-customer feed derived from this user's order-summary rows
// (newest first). Read state is tracked with customer_last_seen_at on the
// login doc (same pattern as the rider feed).
// ============================================================
customerRouter.get("/notifications", async (req, res, next) => {
  try {
    const userId = req.userData.id;
    const db = getDb();

    const docs = await db
      .collection(ORDER_COLLECTION)
      .find({ user_id: new ObjectId(userId) })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();

    const items = [];
    for (const d of docs) {
      const restaurant = d.restaurant_name || "your restaurant";
      if (d.status === "Delivered") {
        items.push(
          notificationFromOrder(
            d,
            "delivery",
            "Order delivered",
            `Order ${d.order_no} from ${restaurant} has been delivered. Enjoy your meal!`,
          ),
        );
      } else if (d.status === "Cancelled") {
        items.push(
          notificationFromOrder(
            d,
            "cancel",
            "Order cancelled",
            `Order ${d.order_no} from ${restaurant} was cancelled.`,
          ),
        );
      } else if (ACTIVE_STATUSES.includes(d.status)) {
        items.push(
          notificationFromOrder(
            d,
            "progress",
            `Order ${d.status}`,
            `Order ${d.order_no} from ${restaurant} is currently ${d.status.toLowerCase()}.`,
          ),
        );
      }
    }

    items.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    // Read state based on the customer's last_seen_at.
    const loginDoc = await db
      .collection(LOGIN_COLLECTION)
      .findOne({ _id: new ObjectId(userId) });
    const lastSeen = loginDoc?.customer_last_seen_at
      ? new Date(loginDoc.customer_last_seen_at)
      : null;

    const notifications = items.map((n) => ({
      ...n,
      time: n.time ? new Date(n.time).toISOString() : null,
      // Nothing is read until the user actually marks it read (last_seen_at).
      read: Boolean(lastSeen && n.time && new Date(n.time) <= lastSeen),
    }));

    res.json({
      notifications,
      unread_count: notifications.filter((n) => !n.read).length,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/customer/notifications/read        { time? }
// ============================================================
// Marks notifications as read (stores the last-seen timestamp on the
// login doc — no notification rows are deleted). With { time } it marks
// everything up to that notification's time as read (called when the
// user clicks a specific item); without a body it marks all as read.
// ============================================================
customerRouter.post("/notifications/read", async (req, res, next) => {
  try {
    const db = getDb();
    const loginDoc = await db
      .collection(LOGIN_COLLECTION)
      .findOne({ _id: new ObjectId(req.userData.id) });
    const current =
      loginDoc?.customer_last_seen_at
        ? new Date(loginDoc.customer_last_seen_at)
        : null;

    // Time of the specific notification the user clicked (optional).
    let markTime = new Date();
    if (req.body?.time) {
      const t = new Date(req.body.time);
      if (!Number.isNaN(t.getTime())) markTime = t;
    }

    // Only move the watermark forward — never backwards.
    const nextSeen = current && current > markTime ? current : markTime;

    await db
      .collection(LOGIN_COLLECTION)
      .updateOne(
        { _id: new ObjectId(req.userData.id) },
        { $set: { customer_last_seen_at: nextSeen, updated_at: new Date() } },
      );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});