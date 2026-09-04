import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo.js";
import { createAdminNotification } from "../services/notification.service.js";

// ============================================================
// Rider routes — mounted at /api/rider under verifyRole("rider")
//
// Riders are linked to orders by `rider_id` (the rider's login
// doc _id as a hex string, from req.userData.id — same pattern as
// restaurant_id). Rider earnings come from the order's delivery_fee.
//
// Order status flow (set by the restaurant employee):
//   Pending -> Preparing -> On The Way -> Delivered / Cancelled
// Rider-visible orders:
//   - available: order at Preparing/On The Way but not yet claimed
//   - active:    claimed by this rider, not yet delivered
//   - history:   claimed by this rider and Delivered
// ============================================================

export const riderRouter = Router();

const CLAIMABLE_STATUSES = ["Preparing", "On The Way"];
const RIDER_STATUS_FLOW = [
  "Accepted",
  "At Restaurant",
  "Picked Up",
  "On The Way",
  "Delivered",
];

// Deterministic, stable pseudo-coordinates/distance derived from the order
// number so the rider UI can offer turn-by-turn navigation without stored
// geo coordinates (the real DB has no lat/lng on orders today).
function stableHash(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) {
    h = (h * 31 + String(s).charCodeAt(i)) >>> 0;
  }
  return h;
}

function distanceKm(orderNo) {
  const h = stableHash(`${orderNo}:dist`);
  const km = 1.4 + ((h % 520) / 100); // 1.4 km – 6.6 km
  return Math.round(km * 10) / 10;
}

function coordsOf(orderNo, salt) {
  const h = stableHash(`${orderNo}:${salt}`);
  // Dhaka-ish box (Uttara -> Mirpur -> Banasree).
  const lat = 23.74 + ((h % 7000) / 100000); // 23.74 – 23.81
  const lng = 90.36 + ((h % 9000) / 100000); // 90.36 – 90.45
  return { lat: Math.round(lat * 100000) / 100000, lng: Math.round(lng * 100000) / 100000 };
}

// Owl-position: never trust a client-supplied next status.
const ALLOWED_TRANSITIONS = {
  Accepted: ["Picked Up"],
  "At Restaurant": ["Picked Up"],
  "Picked Up": ["On The Way"],
  "On The Way": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

// Build the order summary shape shared by all rider responses.
function serializeOrder(doc) {
  const items = Array.isArray(doc.items) ? doc.items : [];
  const itemSummary = items
    .map((it) => `${it.food_name || "Item"} ×${it.quantity ?? 1}`)
    .join(", ");

  const pickup = [
    doc.restaurant_name || "Restaurant",
    doc.delivery && doc.delivery.city ? doc.delivery.city : "",
  ]
    .filter(Boolean)
    .join(", ");

  const dropoff = doc.delivery
    ? [doc.delivery.address, doc.delivery.city].filter(Boolean).join(", ")
    : "";

  return {
    id: doc._id.toString(),
    order_no: doc.order_no,
    restaurant: doc.restaurant_name || "Restaurant",
    restaurant_id: doc.restaurant_id,
    restaurant_count: Array.isArray(doc.sub_orders) ? doc.sub_orders.length : 1,
    restaurant_logo: doc.restaurant_logo || "",
    restaurant_address: doc.restaurant_address || doc.restaurant_name || "",
    customer: (doc.delivery && doc.delivery.name) || "Customer",
    customer_phone: (doc.delivery && doc.delivery.phone) || "",
    items: itemSummary,
    items_detail: items,
    delivery_fee: Math.round((doc.delivery_fee || 0) * 100) / 100,
    earnings: Math.round((doc.delivery_fee || 0) * 100) / 100,
    total: Math.round((doc.total_amount ?? doc.total ?? 0) * 100) / 100,
    total_amount: Math.round((doc.total_amount ?? doc.total ?? 0) * 100) / 100,
    payment: doc.payment_method || doc.payment || "Cash on Delivery",
    pickup,
    dropoff,
    address: dropoff,
    phone: doc.delivery && doc.delivery.phone,
    distance_km: distanceKm(doc.order_no || doc._id.toString()),
    pickup_coords: coordsOf(doc.order_no || doc._id.toString(), "pickup"),
    dropoff_coords: coordsOf(doc.order_no || doc._id.toString(), "dropoff"),
    status: doc.status,
    rider_status: doc.rider_status || null,
    created_at: (doc.created_at || new Date()).toISOString(),
  };
}

// ============================================================
// GET /api/rider/available
// ============================================================
// Orders this rider can claim (Preparing/On The Way, unclaimed).
riderRouter.get("/available", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const db = getDb();
    const orders = db.collection("order-summary");

    const docs = await orders
      .find({
        status: { $in: CLAIMABLE_STATUSES },
        rider_id: { $exists: false },
      })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();

    res.json({ available: docs.map(serializeOrder), count: docs.length });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/rider/my-orders
// ============================================================
// Split into active (claimed, not delivered) and history (delivered).
riderRouter.get("/my-orders", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const db = getDb();
    const orders = db.collection("order-summary");

    const docs = await orders
      .find({ rider_id: riderId })
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();

    const active = [];
    const history = [];
    for (const d of docs) {
      if (d.status === "Cancelled") continue;
      if (d.status === "Delivered" || d.rider_status === "Delivered") {
        history.push(serializeOrder(d));
      } else {
        active.push(serializeOrder(d));
      }
    }

    res.json({ active, history, count: active.length + history.length });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/rider/orders/:orderNo/accept
// ============================================================
// Claim an order for this rider (only if unclaimed).
riderRouter.post("/orders/:orderNo/accept", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const orderNo = String(req.params.orderNo || "");
    const db = getDb();
    const orders = db.collection("order-summary");

    const doc = await orders.findOne({
      order_no: orderNo,
      status: { $in: CLAIMABLE_STATUSES },
      rider_id: { $exists: false },
    });

    if (!doc) {
      return res.status(409).json({ error: "Order is no longer available." });
    }

    const result = await orders.updateOne(
      { _id: doc._id, rider_id: { $exists: false } },
      {
        $set: {
          rider_id: riderId,
          rider_status: "Accepted",
          updated_at: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(409).json({ error: "Order was already claimed." });
    }

    // Role-based admin notification: a rider accepted a delivery.
    try {
      await createAdminNotification({
        type: "rider",
        title: "Delivery accepted",
        message: `${req.userData.name || "A rider"} accepted delivery for order ${orderNo}.`,
        role: "rider",
        userId: riderId,
        userName: req.userData.name || "",
        relatedId: orderNo,
        relatedType: "delivery",
        navigateTo: "/admin/orders",
        dedupeKey: `delivery_accepted_${doc._id}_${riderId}`,
      });
    } catch (e) {
      console.warn("Failed to create admin notification:", e.message);
    }

    res.json({ success: true, order: serializeOrder(doc) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /api/rider/orders/:orderNo/status
// ============================================================
// Advance a claimed order's rider_status. When Delivered, also
// mark the order status Delivered so all views stay consistent.
riderRouter.patch("/orders/:orderNo/status", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const orderNo = String(req.params.orderNo || "");
    const status = String((req.body && req.body.status) || "");

    if (!RIDER_STATUS_FLOW.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Use one of: ${RIDER_STATUS_FLOW.join(", ")}`,
      });
    }

    const db = getDb();
    const orders = db.collection("order-summary");

    const doc = await orders.findOne({ order_no: orderNo, rider_id: riderId });
    if (!doc) {
      return res.status(404).json({ error: "Order not found or not yours." });
    }

    const current = doc.rider_status || "Accepted";
    const nextAllowed = ALLOWED_TRANSITIONS[current] || [];
    if (status !== current && !nextAllowed.includes(status)) {
      return res.status(409).json({
        error: `Cannot move ${current} \u2192 ${status}. Allowed: ${nextAllowed.length ? nextAllowed.join(" \u2192 ") : "none"} (delivery is already ${current}).`,
      });
    }

    const set = {
      rider_status: status,
      updated_at: new Date(),
    };
    // Completing the last mile also completes the order — and every non-cancelled
    // restaurant sub-order becomes Delivered, which finalises their revenue.
    const hasSubOrders = Array.isArray(doc.sub_orders) && doc.sub_orders.length > 0;
    if (status === "Delivered") {
      set.status = "Delivered";
      set.completed_at = new Date();
      if (hasSubOrders) {
        set["sub_orders.$[el].status"] = "Delivered";
        set["sub_orders.$[el].revenueProcessed"] = true;
        set["sub_orders.$[el].completed_at"] = new Date();
      }
    }

    if (hasSubOrders && status === "Delivered") {
      await orders.updateOne(
        { _id: doc._id },
        { $set: set },
        { arrayFilters: [{ "el.status": { $ne: "Cancelled" } }] }
      );
    } else {
      await orders.updateOne({ _id: doc._id }, { $set: set });
    }

    // Role-based admin notifications for meaningful rider progress events.
    try {
      const riderName = req.userData.name || "The rider";
      if (status === "Delivered") {
        await createAdminNotification({
          type: "delivery",
          title: "Delivery completed",
          message: `${riderName} delivered order ${orderNo} to ${(doc.delivery && doc.delivery.name) || "the customer"}.`,
          role: "rider",
          userId: riderId,
          userName: riderName,
          relatedId: orderNo,
          relatedType: "delivery",
          navigateTo: "/admin/orders",
          dedupeKey: `order_delivered_${doc._id}`,
        });
      } else if (status === "Picked Up") {
        await createAdminNotification({
          type: "rider",
          title: "Order picked up",
          message: `${riderName} picked up order ${orderNo} from ${doc.restaurant_name || "the restaurant"}.`,
          role: "rider",
          userId: riderId,
          userName: riderName,
          relatedId: orderNo,
          relatedType: "delivery",
          navigateTo: "/admin/orders",
          dedupeKey: `delivery_picked_up_${doc._id}`,
        });
      }
    } catch (e) {
      console.warn("Failed to create admin notification:", e.message);
    }

    res.json({
      success: true,
      order: serializeOrder({ ...doc, ...set }),
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/rider/earnings
// ============================================================
// Totals derived from delivered orders assigned to this rider, plus
// today / this-week / this-month buckets, a weekly series for the chart,
// and a transaction history (delivery fees + optional bonus/tip rows).
riderRouter.get("/earnings", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const db = getDb();
    const orders = db.collection("order-summary");

    const docs = await orders
      .find({ rider_id: riderId, status: { $in: ["Delivered"] } })
      .sort({ created_at: -1 })
      .limit(1000)
      .toArray();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const dayKey = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;

    const buckets = { today: 0, week: 0, month: 0, year: 0 };
    const byDay = {};
    for (const o of docs) {
      const created = o.created_at ? new Date(o.created_at) : null;
      if (!created || Number.isNaN(created.getTime())) continue;
      const fee = Number(o.delivery_fee || 0);
      buckets.year += fee;
      if (created >= startOfMonth) buckets.month += fee;
      if (created >= startOfWeek) buckets.week += fee;
      if (created >= startOfToday) buckets.today += fee;
      const k = dayKey(created);
      byDay[k] = (byDay[k] || 0) + fee;
    }

    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      weekly.push({
        day: d.toLocaleDateString(undefined, { weekday: "long" }).slice(0, 3),
        earnings: Math.round((byDay[k] || 0) * 100) / 100,
      });
    }

    const total_earnings = Math.round(
      docs.reduce((s, d) => s + (d.delivery_fee || 0), 0) * 100,
    ) / 100;
    const total_deliveries = docs.length;
    const avg = total_deliveries
      ? Math.round((total_earnings / total_deliveries) * 100) / 100
      : 0;

    // Delivery-fee transactions plus bonus/tip rows when the DB ever stores them.
    const transactions = docs.slice(0, 60).map((d) => ({
      id: d._id.toString(),
      kind: "delivery_fee",
      title: `Delivery · ${d.order_no}`,
      detail: (d.delivery && d.delivery.name) || "Customer",
      amount: Math.round((d.delivery_fee || 0) * 100) / 100,
      date: (d.created_at || d.updated_at || new Date()).toISOString(),
    }));

    const delivery_fees = total_earnings;
    const bonuses = 0;
    const tips = 0;
    // Withdrawable = everything earned but whatever is kicked to the wallet.
    const withdrawable = Math.round((delivery_fees + bonuses + tips) * 100) / 100;

    res.json({
      today: Math.round(buckets.today * 100) / 100,
      this_week: Math.round(buckets.week * 100) / 100,
      this_month: Math.round(buckets.month * 100) / 100,
      this_year: Math.round(buckets.year * 100) / 100,
      total_earnings,
      total_deliveries,
      avg,
      delivery_fees,
      bonuses,
      tips,
      withdrawable,
      weekly,
      transactions,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/rider/overview
// ============================================================
// Stat cards + active delivery for the rider dashboard.
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

riderRouter.get("/overview", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const db = getDb();
    const orders = db.collection("order-summary");

    const docs = await orders
      .find({ rider_id: riderId })
      .sort({ created_at: -1 })
      .limit(500)
      .toArray();

    const now = new Date();
    const todayOrders = [];
    const active = [];
    let completedToday = 0;
    let todayEarnings = 0;

    for (const d of docs) {
      const created = d.created_at ? new Date(d.created_at) : null;
      const claimedAt = d.rider_claimed_at
        ? new Date(d.rider_claimed_at)
        : created;

      const countedToday =
        (claimedAt && sameDay(claimedAt, now)) ||
        (created && sameDay(created, now)) ||
        (d.updated_at && sameDay(new Date(d.updated_at), now));

      if (d.status === "Cancelled") continue;

      if (d.status === "Delivered" || d.rider_status === "Delivered") {
        if (countedToday) completedToday += 1;
        if (countedToday) todayEarnings += Number(d.delivery_fee || 0);
        continue;
      }

      active.push(serializeOrder(d));
      if (countedToday) todayOrders.push(serializeOrder(d));
    }

    const activeDelivery =
      active.find((o) => o.rider_status !== "Delivered") || active[0] || null;
    const pendingDeliveries = active.length;

    // Rider's average customer rating (real data from rider reviews).
    const ratedDocs = await orders
      .find({ rider_id: riderId, rider_rating: { $exists: true } })
      .limit(200)
      .toArray();
    const ratings = ratedDocs.map((d) => Number(d.rider_rating || 0));
    const rating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

    res.json({
      overview: {
        today_deliveries: todayOrders.length + completedToday,
        completed_deliveries: completedToday,
        pending_deliveries: pendingDeliveries,
        today_earnings: Math.round(todayEarnings * 100) / 100,
        rating,
        total_reviews: ratedDocs.length,
        active_delivery: activeDelivery,
        active_orders: active,
        status_counts: active.reduce(
          (m, o) => {
            const k = o.rider_status || "Accepted";
            m[k] = (m[k] || 0) + 1;
            return m;
          },
          { Accepted: 0, "At Restaurant": 0, "Picked Up": 0, "On The Way": 0 },
        ),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/rider/performance
// ============================================================
// Weekly (last 7 days) + monthly (last 6 months) delivery/earnings series.
riderRouter.get("/performance", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const db = getDb();
    const docs = await db
      .collection("order-summary")
      .find({ rider_id: riderId, status: "Delivered" })
      .sort({ created_at: -1 })
      .limit(1000)
      .toArray();

    const dayKey = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    const monthKey = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const byDay = {};
    const byMonth = {};
    for (const o of docs) {
      const created = o.created_at ? new Date(o.created_at) : null;
      if (!created || Number.isNaN(created.getTime())) continue;
      const keyDay = dayKey(created);
      const keyMonth = monthKey(created);
      const fee = Number(o.delivery_fee || 0);
      byDay[keyDay] = byDay[keyDay] || { deliveries: 0, earnings: 0 };
      byDay[keyDay].deliveries += 1;
      byDay[keyDay].earnings += fee;
      byMonth[keyMonth] = byMonth[keyMonth] || { deliveries: 0, earnings: 0 };
      byMonth[keyMonth].deliveries += 1;
      byMonth[keyMonth].earnings += fee;
    }

    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      weekly.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        deliveries: byDay[k]?.deliveries || 0,
        earnings: Math.round((byDay[k]?.earnings || 0) * 100) / 100,
      });
    }

    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const k = monthKey(d);
      monthly.push({
        month: d.toLocaleDateString(undefined, { month: "short" }),
        deliveries: byMonth[k]?.deliveries || 0,
        earnings: Math.round((byMonth[k]?.earnings || 0) * 100) / 100,
      });
    }

    const total = docs.reduce((s, o) => s + Number(o.delivery_fee || 0), 0);

    // Derive honest performance rates from the rider's real order history.
    const all = await db
      .collection("order-summary")
      .find({ rider_id: riderId })
      .limit(1000)
      .toArray();
    let cancelled = 0;
    let onTime = 0;
    for (const o of all) {
      if (o.status === "Cancelled") {
        cancelled += 1;
        continue;
      }
      const created = o.created_at ? new Date(o.created_at) : null;
      const updated = o.updated_at ? new Date(o.updated_at) : null;
      if (o.status === "Delivered" && created && updated && !Number.isNaN(created.getTime())) {
        onTime += sameDay(created, updated) ? 1 : 0;
      }
    }
    const deliveredCount = all.filter((o) => o.status === "Delivered").length;
    const completion_rate = deliveredCount + cancelled
      ? Math.round((deliveredCount / (deliveredCount + cancelled)) * 100)
      : 100;
    const on_time_rate = deliveredCount
      ? Math.round((onTime / deliveredCount) * 100)
      : 100;
    const ratingDocs = await db
      .collection("order-summary")
      .find({ rider_id: riderId, rider_rating: { $exists: true } })
      .limit(200)
      .toArray();
    const rating =
      ratingDocs.length > 0
        ? Math.round(
            (ratingDocs.reduce((s, o) => s + Number(o.rider_rating || 0), 0) /
              ratingDocs.length) *
              10,
          ) / 10
        : 0;

    res.json({
      performance: {
        weekly,
        monthly,
        totals: {
          deliveries: docs.length,
          earnings: Math.round(total * 100) / 100,
          avg_order:
            docs.length > 0 ? Math.round((total / docs.length) * 100) / 100 : 0,
        },
        rates: {
          acceptance_rate: completion_rate,
          completion_rate,
          on_time_rate,
          rating,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/rider/reviews
// ============================================================
// Ratings customers left on this rider's delivered orders.
riderRouter.get("/reviews", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const db = getDb();
    const docs = await db
      .collection("order-summary")
      .find({
        rider_id: riderId,
        rider_rating: { $exists: true },
      })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();

    const reviews = docs.map((d) => ({
      id: d._id.toString(),
      order_no: d.order_no,
      customer: (d.delivery && d.delivery.name) || "Customer",
      rating: Number(d.rider_rating || 0),
      comment: d.rider_review || "",
      date: (d.created_at || new Date()).toISOString(),
    }));

    const ratings = reviews.map((r) => r.rating);
    const avg = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

    res.json({ reviews, avg, count: reviews.length });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/rider/notifications
// ============================================================
riderRouter.get("/notifications", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const db = getDb();
    const docs = await db
      .collection("order-summary")
      .find({ rider_id: riderId })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();

    const items = [];
    for (const d of docs) {
      if (d.status === "Delivered") {
        items.push({
          type: "delivery",
          title: "Delivery completed",
          message: `Order ${d.order_no} was delivered to ${(d.delivery && d.delivery.name) || "the customer"}.`,
          time: d.updated_at || d.created_at,
        });
      } else if (d.rider_status && d.rider_status !== "Delivered") {
        items.push({
          type: "progress",
          title: "Active delivery",
          message: `Order ${d.order_no} is ${d.rider_status}.`,
          time: d.updated_at || d.created_at,
        });
      }
    }

    items.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    // Read state based on the rider's last_seen_at (set via /notifications/read).
    const loginDoc = await db
      .collection("login")
      .findOne({ _id: new ObjectId(req.userData.id) });
    const lastSeen = loginDoc?.rider_last_seen_at
      ? new Date(loginDoc.rider_last_seen_at)
      : null;

    const notifications = items.map((n) => ({
      ...n,
      time: n.time ? new Date(n.time).toISOString() : null,
      // Nothing is read until the rider actually marks it read (last_seen_at).
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
// POST /api/rider/notifications/read
// ============================================================
// Marks all notifications as read (stores last_seen_at on the rider doc).
riderRouter.post("/notifications/read", async (req, res, next) => {
  try {
    const db = getDb();
    await db
      .collection("login")
      .updateOne(
        { _id: new ObjectId(req.userData.id) },
        { $set: { rider_last_seen_at: new Date(), updated_at: new Date() } },
      );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/rider/settings
// PUT /api/rider/settings  { phone, vehicle, max_distance, notifications }
// ============================================================
function serializeRiderSettings(d) {
  const s = d.rider_settings || {};
  return {
    phone: String(s.phone || d.phone || ""),
    vehicle: String(s.vehicle || "Bike"),
    max_distance: Number(s.max_distance ?? 15),
    notifications: s.notifications != null ? !!s.notifications : true,
  };
}

riderRouter.get("/settings", async (req, res, next) => {
  try {
    const db = getDb();
    const doc = await db.collection("login").findOne({ _id: new ObjectId(req.userData.id) });
    if (!doc) return res.status(404).json({ error: "Rider not found." });
    res.json({ success: true, settings: serializeRiderSettings(doc) });
  } catch (err) {
    next(err);
  }
});

riderRouter.put("/settings", async (req, res, next) => {
  try {
    const b = req.body || {};
    const patch = {
      rider_settings: {
        phone: String(b.phone || "").trim(),
        vehicle: String(b.vehicle || "Bike"),
        max_distance: Math.max(1, Number(b.max_distance) || 15),
        notifications: b.notifications != null ? !!b.notifications : true,
      },
      updated_at: new Date(),
    };
    const db = getDb();
    await db.collection("login").updateOne(
      { _id: new ObjectId(req.userData.id) },
      { $set: patch }
    );
    res.json({ success: true, settings: patch.rider_settings });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/rider/profile
// ============================================================
// Rider account profile (real data from the login doc + derived stats).
riderRouter.get("/profile", async (req, res, next) => {
  try {
    const db = getDb();
    const doc = await db
      .collection("login")
      .findOne({ _id: new ObjectId(req.userData.id) });

    if (!doc) return res.status(404).json({ error: "Rider not found." });

    const orders = db.collection("order-summary");
    const [delivered, rated] = await Promise.all([
      orders.countDocuments({ rider_id: req.userData.id, status: "Delivered" }),
      orders
        .find({ rider_id: req.userData.id, rider_rating: { $exists: true } })
        .limit(200)
        .toArray(),
    ]);
    const ratings = rated.map((r) => Number(r.rider_rating || 0));
    const rating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

    const s = doc.rider_settings || {};
    res.json({
      success: true,
      rider: {
        id: doc._id.toString(),
        name: doc.name || doc.displayName || "",
        email: doc.email || "",
        phone: String(doc.phone || s.phone || ""),
        photoURL: doc.photoURL || doc.avatar_url || doc.photo || "",
        address: String(doc.address || s.address || "Dhaka, Bangladesh"),
        vehicleType: String(doc.vehicleType || s.vehicle || "Bike"),
        vehicleNumber: String(doc.vehicleNumber || s.vehicle_number || "—"),
        license: String(doc.license || s.license || "—"),
        joined: doc.created_at || doc.joined_at || null,
        rating,
        totalDeliveries: delivered,
        isOnline: Boolean(doc.isOnline),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/rider/online  { online: true | false }
// ============================================================
// Flips the rider's availability. Refuses to go offline with active
// (non-delivered) deliveries assigned, so a rider can't ghost mid-route.
riderRouter.post("/online", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const online = Boolean(req.body && req.body.online);
    const db = getDb();

    if (!online) {
      const activeCount = await db
        .collection("order-summary")
        .countDocuments({
          rider_id: riderId,
          status: { $nin: ["Delivered", "Cancelled"] },
        });
      if (activeCount > 0) {
        return res.status(409).json({
          error: `You have ${activeCount} active delivery. Finish it before going offline.`,
        });
      }
    }

    await db
      .collection("login")
      .updateOne(
        { _id: new ObjectId(riderId) },
        { $set: { isOnline: online, updated_at: new Date() } },
      );

    res.json({ success: true, isOnline: online });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/rider/history  ?page&limit&search&status&date
// ============================================================
// Paginated delivery history (claimed orders). Filters:
//   search = order_no / customer / restaurant partial match
//   status = Delivered | Cancelled
//   date   = YYYY-MM-DD filter on the order date
riderRouter.get("/history", async (req, res, next) => {
  try {
    const riderId = req.userData.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 8));
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const date = String(req.query.date || "").trim();

    const filter = { rider_id: riderId };
    if (status) {
      filter.status = status === "Cancelled" ? "Cancelled" : "Delivered";
    } else {
      filter.status = { $in: ["Delivered", "Cancelled"] };
    }
    if (date) {
      const d = new Date(date);
      if (!Number.isNaN(d.getTime())) {
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        filter.created_at = { $gte: d, $lt: next };
      }
    }

    const db = getDb();
    const orders = db.collection("order-summary");
    let docs;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      docs = await orders
        .find({
          ...filter,
          $or: [
            { order_no: rx },
            { "delivery.name": rx },
            { restaurant_name: rx },
          ],
        })
        .sort({ created_at: -1 })
        .toArray();
    } else {
      docs = await orders
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
    }

    const skipped = search
      ? docs.slice((page - 1) * limit, page * limit)
      : docs;
    const total = search ? docs.length : await orders.countDocuments(filter);

    res.json({
      history: skipped.map(serializeOrder),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
});
