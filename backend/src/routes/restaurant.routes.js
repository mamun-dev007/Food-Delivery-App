import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo.js";
import { createAdminNotification } from "../services/notification.service.js";
import { enrichReviews } from "../services/reviews.service.js";
import {
  COMMISSION_RATE,
  recomputeOrderStatus,
  revenueRecord,
  round2,
  subOrderForRestaurant,
} from "../services/revenue.service.js";

const FOOD_COLLECTION = "food-collection";
const LOW_STOCK_THRESHOLD = 10;

// ============================================================
// PUBLIC  GET /api/restaurants
// ============================================================
// List all approved restaurants from the DB for the customer-facing
// Restaurants page. Returns only the fields the UI needs.
// ============================================================
export const publicRestaurantRouter = Router();

function serializePublicRestaurant(d) {
  return {
    id: d._id ? d._id.toString() : "",
    name: d.name || "",
    cuisine: d.cuisine || "",
    address: d.address || "",
    rating: Number(d.rating || 0),
    time: d.delivery_time || d.deliveryTime || "25 min",
    delivery_charge: Number(d.delivery_charge || 0),
    min_order: Number(d.min_order || 0),
    is_open:
      d.open != null
        ? !!d.open
        : d.is_open != null
          ? !!d.is_open
          : true,
    image: d.cover_url || d.logo_url || "",
    logo: d.logo_url || "",
  };
}

publicRestaurantRouter.get("/", async (req, res, next) => {
  try {
    const db = getDb();
    const docs = await db
      .collection("resturent-collection")
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    res.json({ success: true, restaurants: docs.map(serializePublicRestaurant) });
  } catch (err) {
    next(err);
  }
});

// GET /api/restaurants/:id  -> one restaurant (photo, name, etc.)
publicRestaurantRouter.get("/:id", async (req, res, next) => {
  try {
    const db = getDb();
    let doc;
    try {
      doc = await db
        .collection("resturent-collection")
        .findOne({ _id: new ObjectId(req.params.id) });
    } catch {
      doc = null;
    }
    if (!doc) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    res.json({ success: true, restaurant: serializePublicRestaurant(doc) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Restaurant-owner routes (mounted under verifyRole("restaurantOwner")).
// The owner's restaurant is identified by req.userData.restaurant_id.
//
//   GET /api/owner/orders           -> list this restaurant's real orders
//   GET /api/owner/orders/summary   -> real order totals for the dashboard
// ============================================================

export const ownerRouter = Router();

// An order doc stores `restaurant_id` (hex string of the restaurant _id) either
// on the top level (single-restaurant orders) or inside `sub_orders[].restaurant_id`
// (multi-restaurant checkouts). Both are matched below so owners only ever see
// their own part of an order.
function ownerOrderFilter(restaurantId) {
  const rid = String(restaurantId);
  return {
    $or: [{ restaurant_id: rid }, { "sub_orders.restaurant_id": rid }],
  };
}

// The per-restaurant view of an order: items, totals, status and revenue split
// are scoped to the owner's sub-order so each restaurant is financially isolated.
function serializeOrder(o, restaurantId, riderNames = {}) {
  const sub = subOrderForRestaurant(o, restaurantId);
  const items = sub && Array.isArray(sub.items) ? sub.items : (Array.isArray(o.items) ? o.items : []);
  const total = Number((sub && sub.total) || o.total_amount || 0);
  return {
    id: o._id.toString(),
    order_id: o.order_no || o._id.toString(),
    order_no: o.order_no || "",
    tracking_id: o.tracking_id || "",
    restaurant_name: o.restaurant_name || "",
    restaurant_count: Array.isArray(o.sub_orders) ? o.sub_orders.length : 1,
    sub_order_id: sub ? sub.subOrderId : null,
    customer: o.delivery?.name || "",
    phone: o.delivery?.phone || "",
    address: o.delivery?.address || "",
    city: o.delivery?.city || "",
    items,
    total,
    subtotal: Number((sub && sub.subtotal) || o.subtotal || 0),
    discount: Number((sub && sub.discount) || o.discount || 0),
    delivery_fee: Number((sub && sub.delivery_fee) || o.delivery_fee || 0),
    payment: o.payment_method || "",
    payment_status: o.payment_status || "",
    status: (sub && sub.status) || o.status || "Pending",
    date: o.created_at ? new Date(o.created_at).toISOString() : null,
    // Rider linkage: whether a rider has claimed this order and their stage.
    rider_assigned: !!o.rider_id,
    rider_name: o.rider_id ? riderNames[o.rider_id.toString()] || "" : "",
    rider_status: o.rider_status || null,
    admin_commission: Number((sub && sub.adminCommission) || 0),
    restaurant_payout: Number((sub && sub.restaurantRevenue) || 0),
  };
}

// All sub-orders belonging to one restaurant across a set of order docs,
// paired with their parent order doc.
function resolveOwnerSubs(allOrders, restaurantId) {
  const out = [];
  for (const o of allOrders || []) {
    const sub = subOrderForRestaurant(o, restaurantId);
    if (sub) out.push({ order: o, sub });
  }
  return out;
}

// GET /api/owner/orders — list the owner's restaurant sub-orders (newest first).
ownerRouter.get("/orders", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    const db = getDb();
    const docs = await db
      .collection("order-summary")
      .find(ownerOrderFilter(restaurantId))
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();

    // Resolve rider display names for every order linked to a rider.
    const riderNames = {};
    const riderIds = [...new Set(docs.map((o) => o.rider_id).filter(Boolean))];
    if (riderIds.length) {
      const riders = await db
        .collection("login")
        .find({ _id: { $in: riderIds.map((id) => new ObjectId(id)) } })
        .project({ name: 1 })
        .toArray();
      for (const r of riders) riderNames[r._id.toString()] = r.name || "Rider";
    }

    res.json({
      success: true,
      orders: docs.map((o) => serializeOrder(o, restaurantId, riderNames)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/owner/orders/summary — totals for the dashboard stat cards.
ownerRouter.get("/orders/summary", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    const db = getDb();
    const docs = await db
      .collection("order-summary")
      .find(ownerOrderFilter(restaurantId))
      .toArray();

    const subs = resolveOwnerSubs(docs, restaurantId);
    const activeOrders = subs.filter(
      ({ sub }) => sub.status !== "Delivered" && sub.status !== "Cancelled"
    ).length;
    const deliveredSubs = subs.filter(({ sub }) => sub.status === "Delivered");
    // Dashboard revenue = 95% of the restaurant's own delivered subtotal.
    const revenue = round2(
      deliveredSubs.reduce((s, { sub }) => s + Number(sub.restaurantRevenue || 0), 0)
    );

    res.json({
      success: true,
      summary: {
        total_orders: subs.length,
        active_orders: activeOrders,
        revenue,
      },
    });
  } catch (err) {
    next(err);
  }
});

const VALID_STATUSES = ["Pending", "Preparing", "On The Way", "Delivered", "Cancelled"];

// PATCH /api/owner/orders/:orderNo/status
// Body: { status }
// A restaurant employee updates the status of one of their order.
ownerRouter.patch("/orders/:orderNo/status", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    const orderNo = String(req.params.orderNo || "").trim();
    if (!orderNo) {
      return res.status(400).json({ error: "Order number is required." });
    }
    const status = String(req.body?.status || "").trim();
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid order status." });
    }

    const db = getDb();
    const orders = db.collection("order-summary");
    const doc = await orders.findOne({
      order_no: orderNo,
      ...ownerOrderFilter(restaurantId),
    });
    if (!doc) {
      return res.status(404).json({ error: "Order not found for this restaurant." });
    }

    const now = new Date();
    const matchSub = (Array.isArray(doc.sub_orders) ? doc.sub_orders : []).find(
      (s) => String(s.restaurant_id) === String(restaurantId)
    );

    if (matchSub) {
      // Update only THIS restaurant's sub-order, then recompute the order-level
      // status (an order is complete only when every non-cancelled sub-order is
      // done). Revenue is marked processed once the sub-order is delivered.
      const nextSubs = doc.sub_orders.map((s) =>
        String(s.restaurant_id) === String(restaurantId)
          ? {
              ...s,
              status,
              revenueProcessed: s.revenueProcessed || status === "Delivered",
              completed_at: status === "Delivered" ? now : s.completed_at || null,
            }
          : s
      );
      const aggregateStatus = recomputeOrderStatus(nextSubs);
      await orders.updateOne(
        { _id: doc._id },
        {
          $set: {
            "sub_orders.$[el].status": status,
            "sub_orders.$[el].revenueProcessed":
              matchSub.revenueProcessed || status === "Delivered",
            "sub_orders.$[el].completed_at":
              status === "Delivered" ? now : matchSub.completed_at || null,
            ...(aggregateStatus !== doc.status ? { status: aggregateStatus } : {}),
            updated_at: now,
          },
        },
        { arrayFilters: [{ "el.restaurant_id": String(restaurantId) }] }
      );
    } else {
      // Legacy single-restaurant order (pre-sub-order): update the top level.
      await orders.updateOne(
        { _id: doc._id },
        {
          $set: {
            status,
            updated_at: now,
            completed_at: status === "Delivered" ? now : null,
          },
        }
      );
    }

    // Role-based admin notification for meaningful restaurant order events.
    try {
      const ownerName = req.userData.name || req.userData.restaurant_name || "";
      const restaurant = await db
        .collection("resturent-collection")
        .findOne({ _id: new ObjectId(restaurantId) });
      const bizName = (restaurant && restaurant.name) || ownerName || "The restaurant";

      if (status === "Cancelled") {
        await createAdminNotification({
          type: "order",
          title: "Order cancelled by restaurant",
          message: `${bizName} cancelled order ${orderNo}.`,
          role: "restaurantOwner",
          userId: req.userData.id,
          userName: ownerName || bizName,
          relatedId: orderNo,
          relatedType: "order",
          navigateTo: "/admin/orders",
          dedupeKey: `order_cancelled_${orderNo}`,
        });
      } else if (status === "Delivered") {
        await createAdminNotification({
          type: "delivery",
          title: "Order delivered",
          message: `${bizName} marked order ${orderNo} as delivered.`,
          role: "restaurantOwner",
          userId: req.userData.id,
          userName: ownerName || bizName,
          relatedId: orderNo,
          relatedType: "order",
          navigateTo: "/admin/orders",
          dedupeKey: `order_delivered_${orderNo}`,
        });
      } else {
        await createAdminNotification({
          type: "order",
          title:
            status === "Preparing"
              ? "Order accepted by restaurant"
              : `Order is ${status}`,
          message: `${bizName} moved order ${orderNo} to "${status}".`,
          role: "restaurantOwner",
          userId: req.userData.id,
          userName: ownerName || bizName,
          relatedId: orderNo,
          relatedType: "order",
          navigateTo: "/admin/orders",
          dedupeKey: `owner_status_${orderNo}_${status}`,
        });
      }
    } catch (e) {
      console.warn("Failed to create admin notification:", e.message);
    }

    res.json({
      success: true,
      order_no: orderNo,
      status,
    });
  } catch (err) {
    next(err);
  }
});

// Map a restaurant doc to the owner-profile shape used by the frontend
// "Manage Restaurant" page.
function serializeRestaurant(d) {
  return {
    id: d._id ? d._id.toString() : "",
    name: d.name || "",
    tagline: d.tagline || d.description || "",
    cuisine: d.cuisine || "Mixed",
    address: d.address || "",
    phone: d.phone || "",
    email: d.email || "",
    deliveryTime: d.delivery_time || d.deliveryTime || "25 min",
    minOrder: Number(d.min_order ?? d.minOrder ?? 0),
    open: d.open != null ? !!d.open : true,
    logo_url: d.logo_url || d.logo || "",
    banner_url: d.banner_url || d.banner || "",
  };
}

// GET /api/owner/restaurant — the owner's own restaurant profile (real DB row).
ownerRouter.get("/restaurant", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res
        .status(400)
        .json({ error: "No restaurant is linked to this account." });
    }
    const db = getDb();
    const doc = await db
      .collection("resturent-collection")
      .findOne({ _id: new ObjectId(restaurantId) });
    if (!doc) {
      return res.status(404).json({ error: "Restaurant not found." });
    }
    res.json({ success: true, restaurant: serializeRestaurant(doc) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/owner/restaurant — update the owner's restaurant profile.
// Body: { name, tagline, cuisine, address, phone, email, deliveryTime,
//         minOrder, open }
ownerRouter.put("/restaurant", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res
        .status(400)
        .json({ error: "No restaurant is linked to this account." });
    }
    const b = req.body || {};
    const name = String(b.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "Restaurant name is required." });
    }
    const patch = {
      name,
      tagline: String(b.tagline || "").trim(),
      description: String(b.tagline || "").trim(),
      cuisine: String(b.cuisine || "").trim() || "Mixed",
      address: String(b.address || "").trim(),
      phone: String(b.phone || "").trim(),
      email: String(b.email || "").trim(),
      delivery_time: String(b.deliveryTime || "").trim() || "25 min",
      min_order: Math.max(0, Number(b.minOrder) || 0),
      open: b.open != null ? !!b.open : true,
      is_open: b.open != null ? !!b.open : true,
      logo_url: String(b.logoUrl || b.logo_url || "").trim(),
      banner_url: String(b.bannerUrl || b.banner_url || "").trim(),
      updated_at: new Date(),
    };
    const db = getDb();
    const result = await db
      .collection("resturent-collection")
      .updateOne({ _id: new ObjectId(restaurantId) }, { $set: patch });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Restaurant not found." });
    }
    const updated = await db
      .collection("resturent-collection")
      .findOne({ _id: new ObjectId(restaurantId) });

    // Role-based admin notification: profile info was updated.
    try {
      await createAdminNotification({
        type: "restaurant",
        title: "Restaurant information updated",
        message: `${patch.name || "A restaurant"} updated its profile (phone, address, hours, ...).`,
        role: "restaurantOwner",
        userId: req.userData.id,
        userName: req.userData.name || patch.name || "",
        relatedId: restaurantId,
        relatedType: "restaurant",
        navigateTo: "/admin/restaurants",
      });
    } catch (e) {
      console.warn("Failed to create admin notification:", e.message);
    }

    res.json({ success: true, restaurant: serializeRestaurant(updated) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Restaurant categories (owner-scoped, MongoDB "categories" collection).
//   GET    /api/owner/categories  -> this restaurant's categories
//   POST   /api/owner/categories  -> add a category { name }
//   DELETE /api/owner/categories/:id -> remove a category
// Each category belongs to one restaurant (restaurant_id).
// ============================================================
function serializeCategory(d) {
  return {
    id: d._id.toString(),
    name: d.name,
    restaurant_id: d.restaurant_id ? d.restaurant_id.toString() : null,
  };
}

ownerRouter.get("/categories", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant linked to this account." });
    }
    const db = getDb();
    const docs = await db
      .collection("categories")
      .find({ restaurant_id: new ObjectId(restaurantId) })
      .sort({ created_at: 1 })
      .toArray();
    res.json({ success: true, categories: docs.map(serializeCategory) });
  } catch (err) {
    next(err);
  }
});

ownerRouter.post("/categories", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant linked to this account." });
    }
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "Category name is required." });
    }
    const db = getDb();
    const existing = await db.collection("categories").findOne({
      restaurant_id: new ObjectId(restaurantId),
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    if (existing) {
      return res.status(409).json({ error: "Category already exists." });
    }
    const doc = {
      restaurant_id: new ObjectId(restaurantId),
      name,
      created_at: new Date(),
    };
    const result = await db.collection("categories").insertOne(doc);
    res.status(201).json({ success: true, category: serializeCategory({ ...doc, _id: result.insertedId }) });
  } catch (err) {
    next(err);
  }
});

ownerRouter.delete("/categories/:id", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant linked to this account." });
    }
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: "Invalid category id." });
    }
    const result = await getDb().collection("categories").deleteOne({
      _id: id,
      restaurant_id: new ObjectId(restaurantId),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Category not found." });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Restaurant reviews (owner-scoped).
//   GET /api/owner/reviews  -> reviews for this restaurant, newest first.
//
// A review belongs to a restaurant either by an explicit restaurant_id on the
// review doc (set when a customer reviews from a restaurant context), or by
// matching the review's dish name to one of this restaurant's own foods.
// ============================================================
function serializeReview(d) {
  return {
    id: d._id.toString(),
    name: d.user_name || "Customer",
    dish: d.dish || "",
    avatar_url: d.avatar_url || "",
    food_image: d.food_image || "",
    rating: Number(d.rating || 0),
    text: d.text || "",
    created_at: d.created_at ? new Date(d.created_at).toISOString() : null,
  };
}

ownerRouter.get("/reviews", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant linked to this account." });
    }
    const db = getDb();

    // This restaurant's own food names, so we can match reviews by dish.
    const foods = await db
      .collection("food-collection")
      .find({ restaurant_id: new ObjectId(restaurantId) })
      .project({ food_name: 1 })
      .toArray();
    const dishNames = foods
      .map((f) => String(f.food_name || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .filter(Boolean);

    let filter;
    if (dishNames.length === 0) {
      filter = { restaurant_id: new ObjectId(restaurantId) };
    } else {
      filter = {
        $or: [
          { restaurant_id: new ObjectId(restaurantId) },
          { dish: { $in: dishNames } },
        ],
      };
    }

    const docs = await db
      .collection("reviews")
      .find(filter)
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();
    const enriched = await enrichReviews(db, docs);

    const ratingStats = {
      avg: 0,
      count: enriched.length,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
    if (enriched.length > 0) {
      const sum = enriched.reduce((s, d) => s + Number(d.rating || 0), 0);
      ratingStats.avg = Math.round((sum / enriched.length) * 10) / 10;
      enriched.forEach((d) => {
        const r = Math.min(5, Math.max(1, Math.floor(Number(d.rating) || 0)));
        if (ratingStats.distribution[r] != null) ratingStats.distribution[r] += 1;
      });
    }

    res.json({
      success: true,
      reviews: enriched.map(serializeReview),
      rating: ratingStats,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Sales analytics (owner-scoped).
//   GET /api/owner/analytics
// Returns the numbers + chart series for the overview & analytics pages:
//   - today's orders / revenue, pending orders
//   - order status distribution
//   - popular foods (most-ordered)
//   - daily sales (last 14 days)
//   - monthly sales (last 12 months)
// ============================================================
function monthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDayShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtMonthShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function dayStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

ownerRouter.get("/analytics", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    const db = getDb();
    const orders = db.collection("order-summary");
    const foods = db.collection(FOOD_COLLECTION);

    const docsPromise = orders.find(ownerOrderFilter(restaurantId)).toArray();
    const ownFoodsPromise = foods
      .find({ restaurant_id: new ObjectId(restaurantId) })
      .toArray();

    const [allOrders, ownFoods] = await Promise.all([docsPromise, ownFoodsPromise]);
    const subs = resolveOwnerSubs(allOrders, restaurantId);

    const statusCounts = { Pending: 0, Preparing: 0, "On The Way": 0, Delivered: 0, Cancelled: 0 };
    let delivered = 0;
    let todayOrders = 0;
    let todayRevenue = 0;
    let pendingCount = 0;
    const orderCountByFood = {};
    const now = new Date();
    const today = dayKey(now);
    const startToday = dayStart(now).getTime();

    for (const { order: o, sub } of subs) {
      const status = sub.status || "Pending";
      if (statusCounts[status] != null) statusCounts[status] += 1;
      if (status === "Delivered") delivered += 1;
      if (status === "Pending") pendingCount += 1;

      const created = o.created_at ? new Date(o.created_at) : null;
      if (created && !Number.isNaN(created.getTime()) && dayKey(created) === today) {
        todayOrders += 1;
      }

      // The restaurant's money lands on the day ITS part was delivered.
      if (status === "Delivered") {
        const comp = sub.completed_at ? new Date(sub.completed_at) : created;
        if (comp && !Number.isNaN(comp.getTime()) && comp.getTime() >= startToday) {
          todayRevenue += Number(sub.restaurantRevenue || 0);
        }
      }

      const items = Array.isArray(sub.items) ? sub.items : [];
      for (const item of items) {
        const key = item.food_id
          ? String(item.food_id)
          : item.name || item.food_name;
        const qty = Number(item.quantity || item.qty || 1);
        orderCountByFood[key] = (orderCountByFood[key] || 0) + qty;
      }
    }

    // Popular foods
    let popular = [];
    if (ownFoods.length > 0) {
      popular = ownFoods
        .map((f) => ({
          name: f.food_name || f.name || "",
          orders: orderCountByFood[f._id.toString()] || 0,
        }))
        .filter((f) => f.orders > 0)
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 6);
    }

    // Daily revenue (last 14 days, zero-filled; 95% payout by delivery day)
    const dailyMap = {};
    const monthlyMap = {};
    const byPayment = {};
    for (const { order: o, sub } of subs) {
      if (sub.status !== "Delivered") continue;
      const created = o.created_at ? new Date(o.created_at) : null;
      const comp = sub.completed_at ? new Date(sub.completed_at) : null;
      const ref = comp && !Number.isNaN(comp.getTime()) ? comp : created;
      if (!ref || Number.isNaN(ref.getTime())) continue;
      const amount = Number(sub.restaurantRevenue || 0);
      dailyMap[dayKey(ref)] = (dailyMap[dayKey(ref)] || 0) + amount;
      monthlyMap[monthKey(ref)] = (monthlyMap[monthKey(ref)] || 0) + amount;
      const method = o.payment_method || "Cash on Delivery";
      byPayment[method] = (byPayment[method] || 0) + amount;
    }
    const dailySales = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailySales.push({
        date: fmtDayShort(d.toISOString()),
        amount: Math.round((dailyMap[dayKey(d)] || 0) * 100) / 100,
      });
    }
    const monthlySales = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      monthlySales.push({
        month: fmtMonthShort(d.toISOString()),
        amount: Math.round((monthlyMap[monthKey(d)] || 0) * 100) / 100,
      });
    }

    res.json({
      success: true,
      analytics: {
        commission_rate: COMMISSION_RATE * 100,
        today: { orders: todayOrders, revenue: round2(todayRevenue) },
        totals: {
          total_orders: subs.length,
          total_foods: ownFoods.length,
          pending: pendingCount,
          delivered,
        },
        status_counts: statusCounts,
        popular_foods: popular,
        daily_sales: dailySales,
        monthly_sales: monthlySales,
        revenue_by_payment: byPayment,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Earnings (owner-scoped).
//   GET /api/owner/earnings
// Revenue + fees breakdown from delivered orders.
// ============================================================
ownerRouter.get("/earnings", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    const db = getDb();
    const all = await db
      .collection("order-summary")
      .find(ownerOrderFilter(restaurantId))
      .toArray();

    const subs = resolveOwnerSubs(all, restaurantId);
    const deliveredSubs = subs.filter(({ sub }) => sub.status === "Delivered");

    // The restaurant keeps 95% of its own subtotal; 5% is the platform
    // commission. Delivery fees belong to the platform, shown for reference.
    const subtotal = round2(deliveredSubs.reduce((s, { sub }) => s + Number(sub.subtotal || 0), 0));
    const commission = round2(deliveredSubs.reduce((s, { sub }) => s + Number(sub.adminCommission || 0), 0));
    const net = round2(deliveredSubs.reduce((s, { sub }) => s + Number(sub.restaurantRevenue || 0), 0));
    const gross = round2(deliveredSubs.reduce((s, { sub }) => s + Number(sub.total || 0), 0));
    const deliveryFees = round2(deliveredSubs.reduce((s, { sub }) => s + Number(sub.delivery_fee || 0), 0));
    const discounts = round2(deliveredSubs.reduce((s, { sub }) => s + Number(sub.discount || 0), 0));

    // Earnings per item: the restaurant's own delivered sub-order items.
    const itemEarnings = {};
    for (const { sub } of deliveredSubs) {
      for (const item of Array.isArray(sub.items) ? sub.items : []) {
        const name = item.food_name || item.name;
        if (!name) continue;
        const unit = Number(item.unit_price ?? item.price ?? 0);
        const qty = Number(item.quantity || item.qty || 1);
        itemEarnings[name] = (itemEarnings[name] || 0) + unit * qty;
      }
    }

    const history = deliveredSubs
      .map(({ order, sub }) => revenueRecord(order, sub))
      .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
      .slice(0, 30);

    res.json({
      success: true,
      earnings: {
        gross,
        subtotal,
        commission,
        commission_rate: COMMISSION_RATE * 100,
        delivery_fees: deliveryFees,
        discounts,
        net,
        total_orders: deliveredSubs.length,
        avg_order: deliveredSubs.length ? round2(subtotal / deliveredSubs.length) : 0,
        avg_net: deliveredSubs.length ? round2(net / deliveredSubs.length) : 0,
        top_items: Object.entries(itemEarnings)
          .map(([name, amount]) => ({ name, amount: round2(amount) }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5),
        history,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Coupons / offers (owner-scoped).
//   GET    /api/owner/coupons
//   POST   /api/owner/coupons  { code, discount_type, value, min_order, expires_in_days, active }
//   DELETE /api/owner/coupons/:id
// ============================================================
function serializeCoupon(d) {
  return {
    id: d._id.toString(),
    code: d.code || "",
    discount_type: d.discount_type || "percent",
    value: Number(d.value || 0),
    min_order: Number(d.min_order || 0),
    expires_in_days: d.expires_in_days != null ? Number(d.expires_in_days) : 7,
    active: d.active != null ? !!d.active : true,
    created_at: d.created_at ? new Date(d.created_at).toISOString() : null,
  };
}

ownerRouter.get("/coupons", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    const docs = await getDb().collection("coupons")
      .find({ restaurant_id: new ObjectId(restaurantId) })
      .sort({ created_at: -1 })
      .toArray();
    res.json({ success: true, coupons: docs.map(serializeCoupon) });
  } catch (err) {
    next(err);
  }
});

ownerRouter.post("/coupons", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    const b = req.body || {};
    const code = String(b.code || "").trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: "Coupon code is required." });
    }
    const discountType = String(b.discount_type || "percent") === "flat" ? "flat" : "percent";
    const value = Math.max(0, Number(b.value) || 0);
    if (value <= 0) {
      return res.status(400).json({ error: "Coupon value must be greater than 0." });
    }
    const doc = {
      restaurant_id: new ObjectId(restaurantId),
      code,
      discount_type: discountType,
      value,
      min_order: Math.max(0, Number(b.min_order) || 0),
      expires_in_days: Math.max(1, Math.floor(Number(b.expires_in_days) || 7)),
      active: b.active != null ? !!b.active : true,
      created_at: new Date(),
    };
    const db = getDb();
    const existing = await db.collection("coupons").findOne({
      restaurant_id: new ObjectId(restaurantId),
      code,
    });
    if (existing) {
      return res.status(409).json({ error: "Coupon code already exists." });
    }
    const result = await db.collection("coupons").insertOne(doc);
    res.status(201).json({ success: true, coupon: serializeCoupon({ ...doc, _id: result.insertedId }) });
  } catch (err) {
    next(err);
  }
});

ownerRouter.delete("/coupons/:id", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: "Invalid coupon id." });
    }
    const result = await getDb().collection("coupons").deleteOne({
      _id: id,
      restaurant_id: new ObjectId(restaurantId),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Coupon not found." });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Notifications (owner-scoped).
//   GET /api/owner/notifications
// Derived from recent restaurant activity (new orders, low stock).
// ============================================================
ownerRouter.get("/notifications", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    const db = getDb();
    const orders = db.collection("order-summary");
    const foods = db.collection(FOOD_COLLECTION);
    const [recentOrders, ownFoods] = await Promise.all([
      orders.find(ownerOrderFilter(restaurantId)).sort({ created_at: -1 }).limit(8).toArray(),
      foods.find({ restaurant_id: new ObjectId(restaurantId) }).toArray(),
    ]);

    const items = [];
    for (const o of recentOrders) {
      const sub = subOrderForRestaurant(o, restaurantId);
      const subStatus = (sub && sub.status) || o.status || "Pending";
      const created = o.created_at ? new Date(o.created_at) : null;
      const who = o.delivery?.name || o.customer?.name || "a customer";
      if (subStatus === "Pending" || subStatus === "Preparing" || subStatus === "On The Way") {
        items.push({
          type: "order",
          title: "New order received",
          message: `${o.order_no || "Order"} from ${who}.`,
          time: created,
        });
      } else if (subStatus === "Delivered") {
        items.push({
          type: "delivered",
          title: "Order delivered",
          message: `${o.order_no || "Order"} was delivered to ${who}.`,
          time: created,
        });
      } else if (subStatus === "Cancelled") {
        items.push({
          type: "info",
          title: "Order cancelled",
          message: `${o.order_no || "Order"} was cancelled.`,
          time: created,
        });
      }
    }
    const saved = await db
      .collection("notifications")
      .find({ restaurant_id: String(restaurantId) })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();
    const alertedFoodIds = new Set();
    for (const n of saved) {
      if (n.food_id) alertedFoodIds.add(String(n.food_id));
      items.push({
        type: n.type || "stock",
        title: n.title || "Low stock alert",
        message: n.message || "A food item is running low.",
        time: n.created_at || null,
      });
    }
    const lowStock = ownFoods.filter(
      (f) => Number(f.stock || 0) < LOW_STOCK_THRESHOLD && !alertedFoodIds.has(String(f._id)),
    );
    for (const f of lowStock) {
      items.push({
        type: "stock",
        title: "Low stock alert",
        message: `"${f.food_name || f.name}" is low (${f.stock} left).`,
        time: f.updated_at || null,
      });
    }

    const recentReviews = await db
      .collection("reviews")
      .find({ restaurant_id: String(restaurantId) })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    for (const r of recentReviews) {
      items.push({
        type: "review",
        title: "New review",
        message: `${r.user_name || r.name || "A customer"} rated ${r.food_name || r.dish || "a dish"} ${r.rating}/5.`,
        time: r.created_at || r.created || null,
      });
    }

    items.sort((a, b) => (new Date(b.time || 0)) - (new Date(a.time || 0)));

    // Read state based on the owner's last_seen_at on the login doc
    // (same pattern as the customer + rider feeds).
    const loginDoc = await db
      .collection("login")
      .findOne({ _id: new ObjectId(req.userData.id) });
    const lastSeen = loginDoc?.owner_last_seen_at
      ? new Date(loginDoc.owner_last_seen_at)
      : null;

    res.json({
      success: true,
      notifications: items.map((n) => {
        const read = Boolean(lastSeen && n.time && new Date(n.time) <= lastSeen);
        return {
          ...n,
          time: n.time ? new Date(n.time).toISOString() : null,
          read,
        };
      }),
      unread_count: items.filter((n) => {
        const read = Boolean(lastSeen && n.time && new Date(n.time) <= lastSeen);
        return !read;
      }).length,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/owner/notifications/read        { time? }
// Marks notifications as read (stores the last-seen timestamp on
// the login doc). With { time } it marks everything up to that
// notification's time as read (called when the owner opens/clicks
// a specific item); without a body it marks all as read.
// ============================================================
ownerRouter.post("/notifications/read", async (req, res, next) => {
  try {
    const db = getDb();
    const login = await db
      .collection("login")
      .findOne({ _id: new ObjectId(req.userData.id) });
    const current = login?.owner_last_seen_at
      ? new Date(login.owner_last_seen_at)
      : null;

    // Time of the specific notification the owner clicked (optional).
    let markTime = new Date();
    if (req.body?.time) {
      const t = new Date(req.body.time);
      if (!Number.isNaN(t.getTime())) markTime = t;
    }

    // Only move the watermark forward — never backwards.
    const nextSeen = current && current > markTime ? current : markTime;

    await db.collection("login").updateOne(
      { _id: new ObjectId(req.userData.id) },
      { $set: { owner_last_seen_at: nextSeen, updated_at: new Date() } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Settings (owner-scoped).
//   GET /api/owner/settings
//   PUT /api/owner/settings  { delivery_time, min_order, currency, notification_prefs }
// ============================================================
function serializeSettings(d) {
  return {
    deliveryTime: d.delivery_time || d.deliveryTime || "25 min",
    minOrder: Number(d.min_order ?? d.minOrder ?? 0),
    currency: d.currency || "৳",
    autoAcceptOrders: d.auto_accept_orders != null ? !!d.auto_accept_orders : false,
    emailNotifications: d.email_notifications != null ? !!d.email_notifications : true,
    smsNotifications: d.sms_notifications != null ? !!d.sms_notifications : false,
  };
}

ownerRouter.get("/settings", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    const db = getDb();
    const doc = await db.collection("resturent-collection").findOne({ _id: new ObjectId(restaurantId) });
    if (!doc) return res.status(404).json({ error: "Restaurant not found." });
    res.json({ success: true, settings: serializeSettings(doc) });
  } catch (err) {
    next(err);
  }
});

ownerRouter.put("/settings", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant is linked to this account." });
    }
    const b = req.body || {};
    const patch = {
      delivery_time: String(b.deliveryTime || "25 min").trim() || "25 min",
      min_order: Math.max(0, Number(b.minOrder) || 0),
      currency: String(b.currency || "৳").trim() || "৳",
      auto_accept_orders: b.autoAcceptOrders != null ? !!b.autoAcceptOrders : false,
      email_notifications: b.emailNotifications != null ? !!b.emailNotifications : true,
      sms_notifications: b.smsNotifications != null ? !!b.smsNotifications : false,
      updated_at: new Date(),
    };
    const db = getDb();
    await db.collection("resturent-collection").updateOne(
      { _id: new ObjectId(restaurantId) },
      { $set: patch }
    );
    res.json({ success: true, settings: serializeSettings(patch) });
  } catch (err) {
    next(err);
  }
});
