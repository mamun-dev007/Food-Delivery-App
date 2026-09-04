// Centralized helper for the persistent, role-based admin notification feed.
//
// Admin notifications live in the "notifications" collection with a fixed
// schema:
//   type         – event kind (order | customer | restaurant | rider | food | review | system)
//   title        – short heading (e.g. "New Order Received")
//   message      – human-readable detail
//   role         – the actor role that triggered it (customer | restaurantOwner | rider)
//   userId       – the actor's login _id (hex string)
//   userName     – the actor's display name
//   relatedId    – the referenced business record (order_no, restaurant _id, food _id, ...)
//   relatedType  – what relatedId points at (order | restaurant | food | user | delivery | review)
//   navigateTo   – where the admin UI should go when the item is clicked
//   isRead       – read/unread flag for the badge + rendering
//   dedupeKey    – optional deterministic key used to prevent duplicate inserts
//   createdAt    – Date, drives the newest-first ordering
//
// Owner stock-alert docs also live in the same collection (filtered by
// restaurant_id) — the admin feed only reads docs with target_role "admin".

import { getDb } from "../db/mongo.js";

export const NOTIFICATIONS_COLLECTION = "notifications";

export function serializeNotification(doc) {
  return {
    _id: String(doc._id),
    type: doc.type || "info",
    title: doc.title || "",
    message: doc.message || "",
    role: doc.role || "customer",
    userId: doc.userId ? String(doc.userId) : null,
    userName: doc.userName || "",
    relatedId: doc.relatedId ? String(doc.relatedId) : null,
    relatedType: doc.relatedType || "",
    navigateTo: doc.navigateTo || "",
    isRead: !!doc.isRead,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

function buildDoc(input) {
  const now = new Date();
  return {
    type: input.type || "info",
    title: input.title || "",
    message: input.message || "",
    role: input.role || "customer",
    userId: input.userId != null ? String(input.userId) : null,
    userName: input.userName || "",
    relatedId: input.relatedId != null ? String(input.relatedId) : null,
    relatedType: input.relatedType || "",
    navigateTo: input.navigateTo || "",
    dedupeKey: input.dedupeKey || null,
    isRead: false,
    target_role: "admin",
    createdAt: input.createdAt ? new Date(input.createdAt) : now,
    ...(input.meta ? { meta: input.meta } : {}),
  };
}

/**
 * Insert one admin notification into MongoDB, skipping it when a notification
 * with the same dedupeKey already exists (keeps single-fire events from
 * creating duplicates across retries).
 */
export async function createAdminNotification(input = {}) {
  try {
    const doc = buildDoc(input);
    const db = getDb();
    const col = db.collection(NOTIFICATIONS_COLLECTION);

    if (doc.dedupeKey) {
      const existing = await col.findOne({ dedupeKey: doc.dedupeKey });
      if (existing) return existing;
    }

    const result = await col.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  } catch {
    // Notifications must never break the primary business flow.
    return null;
  }
}

/** Newest-first admin feed (persistent). */
export async function listAdminNotifications(limit = 50) {
  const db = getDb();
  const docs = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .find({ target_role: "admin" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(serializeNotification);
}

/** Count of unread admin notifications. */
export async function countUnreadAdminNotifications() {
  const db = getDb();
  return db
    .collection(NOTIFICATIONS_COLLECTION)
    .countDocuments({ target_role: "admin", isRead: false });
}