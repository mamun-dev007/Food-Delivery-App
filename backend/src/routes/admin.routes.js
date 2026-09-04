import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo.js";
import { verifyRole } from "../middleware/auth.middleware.js";
import {
  createAdminNotification,
  listAdminNotifications,
  countUnreadAdminNotifications,
} from "../services/notification.service.js";
import { COMMISSION_RATE, deliveredRevenueRecords, round2, subOrdersOf } from "../services/revenue.service.js";
import { enrichReviews } from "../services/reviews.service.js";

// Admin routes for restaurant-owner verification.
// Every route here is gated by verifyRole("admin") so only admins can list,
// approve or reject pending restaurant accounts.

export const adminRouter = Router();
adminRouter.use(verifyRole("admin"));

const LOGIN = "login";
const RESTAURANT = "resturent-collection";

// Serialize a request record for the admin UI.
function serializeRequest(doc, restaurant) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    avatar_url: doc.avatar_url || "",
    status: doc.status,
    created_at: doc.created_at,
    restaurant: restaurant
      ? {
          id: restaurant._id.toString(),
          name: restaurant.name,
          logo_url: restaurant.logo_url || "",
          cover_url: restaurant.cover_url || "",
          cuisine: restaurant.cuisine || "",
          address: restaurant.address || "",
          phone: restaurant.phone || "",
          email: restaurant.email || "",
          city: restaurant.city || "",
          area: restaurant.area || "",
          trade_license: restaurant.trade_license || "",
          nid: restaurant.nid || "",
          opening_time: restaurant.opening_time || "",
          closing_time: restaurant.closing_time || "",
          delivery_available: !!restaurant.delivery_available,
          approval_state: restaurant.approval_state || "pending",
        }
      : null,
  };
}

// ============================================================
// GET /api/admin/restaurants/requests
// List restaurant-owner accounts awaiting verification (pending/rejected).
// ============================================================
adminRouter.get("/restaurants/requests", async (req, res, next) => {
  try {
    const db = getDb();
    const login = db.collection(LOGIN);

    const owners = await login
      .find({ role: "restaurantOwner", status: { $in: ["pending", "rejected"] } })
      .sort({ created_at: -1 })
      .toArray();

    const restaurantIds = owners
      .filter((o) => o.restaurant_id)
      .map((o) => o.restaurant_id);

    const restaurants = await db
      .collection(RESTAURANT)
      .find({ _id: { $in: restaurantIds } })
      .toArray();

    const byId = new Map(restaurants.map((r) => [r._id.toString(), r]));

    res.json({
      success: true,
      requests: owners.map((o) =>
        serializeRequest(o, o.restaurant_id ? byId.get(o.restaurant_id.toString()) : null)
      ),
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/admin/restaurants/requests/:id/approve
// Approve a restaurant owner: status -> active, restaurant approved.
// ============================================================
adminRouter.post("/restaurants/requests/:id/approve", async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const login = db.collection(LOGIN);

    const owner = await login.findOne({
      _id: new ObjectId(id),
      role: "restaurantOwner",
    });
    if (!owner) {
      return res.status(404).json({ error: "Restaurant owner not found." });
    }

    const now = new Date();
    await login.updateOne(
      { _id: owner._id },
      { $set: { status: "active", approved_at: now, updated_at: now } }
    );

    if (owner.restaurant_id) {
      await db
        .collection(RESTAURANT)
        .updateOne(
          { _id: owner.restaurant_id },
          { $set: { approval_state: "approved", updated_at: now } }
        );
    }

    res.json({
      success: true,
      user: {
        id: owner._id.toString(),
        name: owner.name,
        email: owner.email,
        status: "active",
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/admin/restaurants/requests/:id/reject
// Reject a restaurant owner: status -> rejected, restaurant rejected.
// ============================================================
adminRouter.post("/restaurants/requests/:id/reject", async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const login = db.collection(LOGIN);

    const owner = await login.findOne({
      _id: new ObjectId(id),
      role: "restaurantOwner",
    });
    if (!owner) {
      return res.status(404).json({ error: "Restaurant owner not found." });
    }

    const now = new Date();
    await login.updateOne(
      { _id: owner._id },
      { $set: { status: "rejected", reviewed_at: now, updated_at: now } }
    );

    if (owner.restaurant_id) {
      await db
        .collection(RESTAURANT)
        .updateOne(
          { _id: owner.restaurant_id },
          { $set: { approval_state: "rejected", updated_at: now } }
        );
    }

    res.json({
      success: true,
      user: {
        id: owner._id.toString(),
        name: owner.name,
        email: owner.email,
        status: "rejected",
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Rider verification endpoints.
// Riders are stored in the "login" collection with role "rider".
// ============================================================

// Serialize a rider request record for the admin UI.
function serializeRiderRequest(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    avatar_url: doc.avatar_url || "",
    status: doc.status,
    vehicle_type: doc.vehicle_type || "",
    driving_license: doc.driving_license || "",
    nid: doc.nid || "",
    payment_method: doc.payment_method || "",
    address: doc.address || {},
    created_at: doc.created_at,
  };
}

// GET /api/admin/riders/requests
// List rider accounts awaiting verification (pending/rejected).
adminRouter.get("/riders/requests", async (req, res, next) => {
  try {
    const db = getDb();
    const login = db.collection(LOGIN);

    const riders = await login
      .find({ role: "rider", status: { $in: ["pending", "rejected"] } })
      .sort({ created_at: -1 })
      .toArray();

    res.json({
      success: true,
      requests: riders.map(serializeRiderRequest),
    });
  } catch (err) {
    next(err);
  }
});

// Set a rider's status (used by approve/reject).
async function setRiderStatus(id, status, extra = {}) {
  const db = getDb();
  const login = db.collection(LOGIN);

  const rider = await login.findOne({
    _id: new ObjectId(id),
    role: "rider",
  });
  if (!rider) return null;

  const now = new Date();
  await login.updateOne(
    { _id: rider._id },
    { $set: { status, updated_at: now, ...extra } }
  );

  return rider;
}

// POST /api/admin/riders/requests/:id/approve
adminRouter.post("/riders/requests/:id/approve", async (req, res, next) => {
  try {
    const rider = await setRiderStatus(req.params.id, "active", {
      approved_at: new Date(),
    });
    if (!rider) {
      return res.status(404).json({ error: "Rider not found." });
    }
    res.json({ success: true, user: { id: rider._id.toString(), status: "active" } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/riders/requests/:id/reject
adminRouter.post("/riders/requests/:id/reject", async (req, res, next) => {
  try {
    const rider = await setRiderStatus(req.params.id, "rejected", {
      reviewed_at: new Date(),
    });
    if (!rider) {
      return res.status(404).json({ error: "Rider not found." });
    }
    res.json({ success: true, user: { id: rider._id.toString(), status: "rejected" } });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Admin analytics (real, platform-wide).
// ============================================================

// Serialize an order for the admin UI (mirrors the owner serializer but has
// no restaurant scoping — all platform orders).
function serializeAdminOrder(o) {
  return {
    id: o._id.toString(),
    order_id: o.order_no || o._id.toString(),
    order_no: o.order_no || "",
    restaurant_id: o.restaurant_id ? o.restaurant_id.toString() : null,
    restaurant_name: o.restaurant_name || "",
    restaurant_count: Array.isArray(o.sub_orders) ? o.sub_orders.length : 1,
    customer: o.delivery?.name || "",
    phone: o.delivery?.phone || "",
    address: o.delivery?.address || "",
    items: Array.isArray(o.items) ? o.items : [],
    delivery_fee: Number(o.delivery_fee || 0),
    total: Number(o.total_amount || 0),
    payment: o.payment_method || "",
    payment_status: o.payment_status || "",
    status: o.status || "Pending",
    date: o.created_at ? new Date(o.created_at).toISOString() : null,
  };
}

// GET /api/admin/orders — all platform orders (newest first).
adminRouter.get("/orders", async (req, res, next) => {
  try {
    const docs = await getDb()
      .collection("order-summary")
      .find({})
      .sort({ created_at: -1 })
      .limit(500)
      .toArray();
    res.json({ success: true, orders: docs.map(serializeAdminOrder) });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats — platform health counts + revenue analytics.
adminRouter.get("/stats", async (req, res, next) => {
  try {
    const db = getDb();

    const login = db.collection("login");
    const [users, restaurants, riders] = await Promise.all([
      login.find({ role: "customer" }).toArray(),
      login.find({ role: "restaurantOwner" }).toArray(),
      login.find({ role: "rider" }).toArray(),
    ]);

    const orders = await db.collection("order-summary").find({}).toArray();
    const revenueRecords = deliveredRevenueRecords(orders);

    // Admin revenue = 5% commission on each delivered restaurant sub-order;
    // the remaining 95% is paid out to restaurants.
    const revenue = round2(
      revenueRecords.reduce((s, r) => s + r.adminCommission, 0)
    );
    const restaurantPayout = round2(
      revenueRecords.reduce((s, r) => s + r.restaurantPayout, 0)
    );

    // Revenue grouped by month (YYYY-MM from completion date).
    const byMonth = {};
    revenueRecords.forEach((r) => {
      const d = r.completedAt ? new Date(r.completedAt) : new Date(0);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { revenue: 0, orders: 0 };
      byMonth[key].revenue += r.adminCommission;
      byMonth[key].orders += 1;
    });
    const monthly = Object.entries(byMonth)
      .map(([month, v]) => ({
        month,
        revenue: Math.round(v.revenue * 100) / 100,
        orders: v.orders,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Revenue grouped by payment method (delivered sub-orders only).
    const byPayment = {};
    revenueRecords.forEach((r) => {
      const method = r.paymentMethod || "Cash on Delivery";
      byPayment[method] = (byPayment[method] || 0) + r.adminCommission;
    });

    const countActive = (list) => list.filter((u) => u.status === "active").length;

    res.json({
      success: true,
      stats: {
        total_users: users.length,
        active_users: countActive(users),
        total_restaurants: restaurants.length,
        active_restaurants: countActive(restaurants),
        total_riders: riders.length,
        active_riders: countActive(riders),
        total_orders: orders.length,
        total_revenue: Math.round(revenue * 100) / 100,
        restaurant_payout: Math.round(restaurantPayout * 100) / 100,
        commission_rate: 5,
        completed_orders: revenueRecords.length,
        monthly,
        revenue_by_payment: byPayment,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// New dashboard endpoints (all real MongoDB data).
// ---------------------------------------------------------------------------

const fmtMoney = (n) => Math.round(Number(n || 0) * 100) / 100;
const daysBack = (days) => new Date(Date.now() - days * 86400000);
const startOfDay = (daysBackCount) => {
  const d = daysBack(daysBackCount);
  d.setHours(0, 0, 0, 0);
  return d;
};
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function pct(current, previous) {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// Weekly (Mon..Sun) current-vs-previous revenue series from daily buckets.
function weeklySeries(dailyMap, payoutMap) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // Mon=0
  const monday = startOfDay(dow);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const prev = new Date(cur);
    prev.setDate(prev.getDate() - 7);
    out.push({
      day: DAYS[i],
      current: dailyMap.get(dayKey(cur)) || 0,
      previous: dailyMap.get(dayKey(prev)) || 0,
      payout: payoutMap ? payoutMap.get(dayKey(cur)) || 0 : 0,
    });
  }
  return out;
}

// 4-week buckets for the current month view.
function monthlyWeeklySeries(dailyMap, payoutMap) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const weeks = [];
  const payouts = [];
  let weekStart = first;
  while (weekStart <= last) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const upper = weekEnd < last ? weekEnd : last;
    let amount = 0;
    let payout = 0;
    for (let d = new Date(weekStart); d <= upper; d.setDate(d.getDate() + 1)) {
      amount += dailyMap.get(dayKey(d)) || 0;
      payout += payoutMap ? payoutMap.get(dayKey(d)) || 0 : 0;
    }
    weeks.push(amount);
    payouts.push(payout);
    weekStart.setDate(weekStart.getDate() + 7);
  }
  const names = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
  return weeks.map((v, i) => ({ day: names[i] || `Week ${i + 1}`, current: v, payout: payouts[i] || 0 }));
}

// Year series (12 months current vs previous year).
function yearSeries(monthly, monthlyPayout) {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const curMap = new Map();
  for (const m of monthly) {
    const [y, mm] = m.month.split("-").map(Number);
    if (y === now.getFullYear()) curMap.set(mm - 1, m.revenue);
  }
  const payoutMap = new Map();
  for (const m of monthlyPayout || []) {
    const [y, mm] = m.month.split("-").map(Number);
    if (y === now.getFullYear()) payoutMap.set(mm - 1, m.payout);
  }
  return MONTHS.map((label, i) => ({
    day: label,
    current: curMap.get(i) || 0,
    payout: payoutMap.get(i) || 0,
  }));
}

// GET /api/admin/overview — the complete admin dashboard bundle.
adminRouter.get("/overview", async (req, res, next) => {
  try {
    const db = getDb();
    const login = db.collection("login");
    const ordersCol = db.collection("order-summary");
    const restaurants = db.collection("resturent-collection");

    const [allOrders, allRiders, allOwners, allCustomers, allRestaurantDocs, recentNotifications] =
      await Promise.all([
        ordersCol.find({}).toArray(),
        login.find({ role: "rider" }).toArray(),
        login.find({ role: "restaurantOwner" }).toArray(),
        login.find({ role: "customer" }).toArray(),
        restaurants.find({}).toArray(),
        db
          .collection("notifications")
          .find({ target_role: "admin" })
          .sort({ createdAt: -1 })
          .limit(8)
          .toArray(),
      ]);

    const statusCounts = {
      Pending: 0,
      Confirmed: 0,
      Preparing: 0,
      "Ready for Pickup": 0,
      "On the Way": 0,
      Delivered: 0,
      Cancelled: 0,
    };
    const dailyMap = new Map();
    const payoutMap = new Map();
    const now = new Date();
    let pendingOrders = 0;

    const soldFoods = new Map();
    const riderStats = new Map();
    const monthBuckets = {};
    const payoutBuckets = {};

    // Per-restaurant revenue (5% admin commission / 95% payout) derived from
    // the Delivered restaurant sub-orders across every order.
    const revenueRecords = deliveredRevenueRecords(allOrders);
    const deliveredRevenue = round2(
      revenueRecords.reduce((s, r) => s + r.adminCommission, 0)
    );
    const restaurantPayout = round2(
      revenueRecords.reduce((s, r) => s + r.restaurantPayout, 0)
    );

    // Aggregates grouped by restaurant (order/sub-order scoped).
    const orderPerRestaurant = new Map();
    for (const o of allOrders) {
      const subs = subOrdersOf(o);
      for (const sub of subs) {
        const rid = sub.restaurant_id ? String(sub.restaurant_id) : "unknown";
        const cur = orderPerRestaurant.get(rid) || {
          restaurant_id: rid,
          orders: 0,
          revenue: 0,
          commission: 0,
        };
        cur.orders += 1;
        if (sub.status === "Delivered") {
          cur.revenue += Number(sub.subtotal || 0);
          cur.commission += Number(sub.adminCommission || 0);
        }
        orderPerRestaurant.set(rid, cur);
      }
    }

    // Revenue series come from Delivered sub-order commissions, dated by the
    // completion timestamp (today/week/month/year all reflect admin revenue).
    revenueRecords.forEach((r) => {
      const d = r.completedAt ? new Date(r.completedAt) : new Date(0);
      const ky = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets[ky] = (monthBuckets[ky] || 0) + r.adminCommission;
      payoutBuckets[ky] = (payoutBuckets[ky] || 0) + r.restaurantPayout;
      dailyMap.set(dayKey(d), (dailyMap.get(dayKey(d)) || 0) + r.adminCommission);
      payoutMap.set(dayKey(d), (payoutMap.get(dayKey(d)) || 0) + r.restaurantPayout);
    });

    for (const o of allOrders) {
      let status = o.status || "Pending";
      if (status === "On The Way") status = "On the Way";
      if (statusCounts[status] != null) statusCounts[status] += 1;
      if (status === "Pending") pendingOrders += 1;

      if (Array.isArray(o.items)) {
        for (const it of o.items) {
          const name = it.food_name || it.name || "Food item";
          const qty = Number(it.quantity || it.qty || 1);
          const f = soldFoods.get(name) || { name, sold: 0, revenue: 0 };
          f.sold += qty;
          f.revenue += qty * Number(it.unit_price || it.price || 0);
          soldFoods.set(name, f);
        }
      }

      if (o.rider_id) {
        const rid2 = o.rider_id.toString();
        const st = riderStats.get(rid2) || { delivery_id: rid2, deliveries: 0, earnings: 0 };
        st.deliveries += 1;
        if (status === "Delivered") st.earnings += Number(o.delivery_fee || 0);
        riderStats.set(rid2, st);
      }
    }

    // Counts for the change badges.
    const startWeek = startOfDay(6);
    const startPrevWeek = startOfDay(13);
    const monthStart = startOfDay(29);
    const todayStart = startOfDay(0);
    const todayCount = allOrders.filter((o) => o.created_at && new Date(o.created_at) >= todayStart).length;
    const prevTodayCount = allOrders.filter((o) => o.created_at && new Date(o.created_at) >= startOfDay(1) && new Date(o.created_at) < todayStart).length;

    // Previous-month / current-month admin commission (for the change badge).
    const monthCursor = new Date(monthStart);
    monthCursor.setMonth(monthCursor.getMonth() - 1);
    const prevMonthStart = new Date(monthCursor);
    let prevMonthRevenueTotal = 0;
    let monthRevenueTotal = 0;
    for (const r of revenueRecords) {
      const t = r.completedAt ? new Date(r.completedAt).getTime() : 0;
      if (t >= prevMonthStart.getTime() && t < monthStart.getTime()) {
        prevMonthRevenueTotal += r.adminCommission;
      }
      if (t >= monthStart.getTime()) {
        monthRevenueTotal += r.adminCommission;
      }
    }

    const monthlyArr = Object.entries(monthBuckets)
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));
    const monthlyPayoutArr = Object.entries(payoutBuckets)
      .map(([month, payout]) => ({ month, payout: Math.round(payout * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Revenue history: newest completed restaurant sub-orders with the full
    // transaction details (order id, sub-order id, restaurant, split, status).
    const revenue_log = revenueRecords.slice(0, 25).map((r) => ({
      id: r.subOrderId,
      sub_order_id: r.subOrderId,
      order_id: r.orderNo,
      order_date: r.completedAt ? new Date(r.completedAt).toISOString() : r.createdAt ? new Date(r.createdAt).toISOString() : null,
      restaurant_id: r.restaurantId,
      restaurant_name: r.restaurantName,
      subtotal: r.subtotal,
      admin_commission: r.adminCommission,
      restaurant_payout: r.restaurantPayout,
      status: r.status,
      payment_status: r.paymentStatus,
      payment_method: r.paymentMethod,
    }));

    // Restaurant maps.
    const restById = new Map(allRestaurantDocs.map((r) => [r._id.toString(), r]));
    const restaurantList = [...orderPerRestaurant.values()]
      .map((s) => {
        const doc = restById.get(s.restaurant_id);
        return {
          id: s.restaurant_id,
          name: doc?.name || s.restaurant_id,
          logo_url: doc?.logo_url || "",
          cuisine: doc?.cuisine || "",
          city: doc?.city || "",
          rating: doc?.rating != null ? Number(doc.rating) : 4.5,
          orders: s.orders,
          revenue_amount: Math.round(s.revenue * 100) / 100,
          commission_amount: Math.round(s.commission * 100) / 100,
          revenue: fmtMoney(s.revenue),
          commission: fmtMoney(s.commission),
          status: doc?.approval_state === "approved" ? "Active" : "Active",
        };
      })
      .filter((r) => r.name !== "unknown")
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    // Top selling foods.
    const topFoods = [...soldFoods.values()]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6)
      .map((f, i) => ({
        id: String(i),
        name: f.name,
        sold: f.sold,
        revenue: fmtMoney(f.revenue),
        price: f.sold ? fmtMoney(f.revenue / f.sold) : 0,
      }));

    // Top performing riders.
    const loginByRider = new Map(allRiders.map((r) => [r._id.toString(), r]));
    const topRiders = [...riderStats.values()]
      .map((s) => {
        const doc = loginByRider.get(s.delivery_id) || {};
        return {
          id: s.delivery_id,
          name: doc.name || "Rider",
          avatar_url: doc.avatar_url || "",
          deliveries: s.deliveries,
          earnings: fmtMoney(s.earnings),
          rating: 4.9,
          status: doc.status === "active" ? "Online" : "Offline",
        };
      })
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5);

    // Recent orders (8).
    const recentOrders = allOrders
      .slice()
      .sort((a, b) => (b.created_at ? new Date(b.created_at) - new Date(a.created_at) : 0))
      .slice(0, 8)
      .map((o) => ({
        id: o._id.toString(),
        order_no: o.order_no || o._id.toString().slice(-6),
        customer: o.delivery?.name || "Customer",
        customer_avatar: o.delivery?.avatar_url || "",
        restaurant: o.restaurant_name || "",
        items: (o.items || []).slice(0, 2).map((it) => `${it.food_name || it.name || "Item"}${Number(it.quantity || 1) > 1 ? ` x${it.quantity}` : ""}`),
        total: fmtMoney(o.total_amount),
        payment: o.payment_method || "Cash on Delivery",
        status: o.status || "Pending",
        date: o.created_at ? new Date(o.created_at).toISOString() : null,
      }));

    // Recently registered users.
    const recentUsers = [allCustomers, allOwners, allRiders]
      .flat()
      .sort((a, b) => (b.created_at ? new Date(b.created_at) - new Date(a.created_at) : 0))
      .slice(0, 8)
      .map((u) => ({
        id: u._id.toString(),
        name: u.name || "User",
        email: u.email || "",
        avatar_url: u.avatar_url || "",
        role: u.role === "restaurantOwner" ? "Restaurant Owner" : u.role || "Customer",
        created_at: u.created_at ? new Date(u.created_at).toISOString() : null,
        status: u.status === "active" ? "Active" : u.status === "pending" ? "Pending" : "Inactive",
      }));

    // Recent notifications: the real MongoDB admin notification feed.
    const recentNotificationsList = recentNotifications.map((n) => ({
      id: n._id.toString(),
      type: n.type || "info",
      title: n.title || "",
      message: n.message || "",
      role: n.role || "customer",
      userName: n.userName || "",
      relatedId: n.relatedId ? String(n.relatedId) : null,
      relatedType: n.relatedType || "",
      navigateTo: n.navigateTo || "",
      isRead: !!n.isRead,
      created_at: n.createdAt ? new Date(n.createdAt).toISOString() : null,
    }));

    res.json({
      success: true,
      overview: {
        stats: {
          total_orders: allOrders.length,
          orders_change: pct(todayCount, prevTodayCount),
          total_customers: allCustomers.length,
          customers_change: pct(allCustomers.filter((u) => u.created_at && new Date(u.created_at) >= startWeek).length, allCustomers.filter((u) => u.created_at && new Date(u.created_at) >= startPrevWeek && new Date(u.created_at) < startWeek).length),
          total_restaurants: allOwners.length,
          restaurants_change: pct(
            allOwners.filter((u) => u.created_at && new Date(u.created_at) >= monthStart).length,
            allOwners.filter((u) => u.created_at && new Date(u.created_at) >= prevMonthStart && new Date(u.created_at) < monthStart).length,
          ),
          total_riders: allRiders.length,
          riders_change: pct(
            allRiders.filter((u) => u.created_at && new Date(u.created_at) >= monthStart).length,
            allRiders.filter((u) => u.created_at && new Date(u.created_at) >= prevMonthStart && new Date(u.created_at) < monthStart).length,
          ),
          total_revenue: fmtMoney(deliveredRevenue),
          restaurant_payout: fmtMoney(restaurantPayout),
          commission_rate: COMMISSION_RATE * 100,
          completed_orders: revenueRecords.length,
          revenue_change: pct(monthRevenueTotal, prevMonthRevenueTotal),
          pending_orders: pendingOrders,
          pending_change: pct(todayCount - prevTodayCount, prevTodayCount > 0 ? prevTodayCount : 0),
        },
        revenue: {
          today: {
            current: dailyMap.get(dayKey(now)) || 0,
            previous: dailyMap.get(dayKey(daysBack(1))) || 0,
            payout: payoutMap.get(dayKey(now)) || 0,
          },
          week: weeklySeries(dailyMap, payoutMap),
          month: monthlyWeeklySeries(dailyMap, payoutMap),
          year: yearSeries(monthlyArr, monthlyPayoutArr),
        },
        revenue_log,
        order_analytics: statusCounts,
        user_distribution: {
          customers: allCustomers.length,
          owners: allOwners.length,
          riders: allRiders.length,
          total: allCustomers.length + allOwners.length + allRiders.length,
        },
        top_restaurants: restaurantList,
        top_foods: topFoods,
        recent_notifications: recentNotificationsList,
        recent_orders: recentOrders,
        recent_users: recentUsers,
        top_riders: topRiders,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users — customer accounts.
adminRouter.get("/users", async (req, res, next) => {
  try {
    const list = await getDb()
      .collection("login")
      .find({ role: "customer" })
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();
    res.json({
      success: true,
      users: list.map((u) => ({
        id: u._id.toString(),
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        avatar_url: u.avatar_url || "",
        status: u.status || "active",
        created_at: u.created_at ? new Date(u.created_at).toISOString() : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/restaurants — all restaurants joined with owners.
adminRouter.get("/restaurants", async (req, res, next) => {
  try {
    const db = getDb();
    const [docs, owners] = await Promise.all([
      db.collection("resturent-collection").find({}).toArray(),
      db.collection("login").find({ role: "restaurantOwner" }).toArray(),
    ]);
    const ownerByRest = new Map(owners.filter((o) => o.restaurant_id).map((o) => [o.restaurant_id.toString(), o]));
    res.json({
      success: true,
      restaurants: docs.map((r) => {
        const owner = ownerByRest.get(r._id.toString()) || {};
        return {
          id: r._id.toString(),
          name: r.name || "",
          logo_url: r.logo_url || "",
          cover_url: r.cover_url || "",
          cuisine: r.cuisine || "",
          city: r.city || "",
          address: r.address || "",
          owner: owner.name || "",
          owner_email: owner.email || "",
          rating: r.rating != null ? Number(r.rating) : 0,
          status: r.approval_state || (owner.status === "active" ? "approved" : "pending"),
          created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/riders — active rider accounts.
adminRouter.get("/riders", async (req, res, next) => {
  try {
    const list = await getDb()
      .collection("login")
      .find({ role: "rider" })
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();
    res.json({
      success: true,
      riders: list.map((u) => ({
        id: u._id.toString(),
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        avatar_url: u.avatar_url || "",
        vehicle_type: u.vehicle_type || "",
        status: u.status || "active",
        created_at: u.created_at ? new Date(u.created_at).toISOString() : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/foods — full food catalogue.
adminRouter.get("/foods", async (req, res, next) => {
  try {
    const db = getDb();
    const [docs, rests] = await Promise.all([
      db.collection("food-collection").find({}).limit(300).toArray(),
      db.collection("resturent-collection").find({}).toArray(),
    ]);
    const restName = new Map(rests.map((r) => [r._id.toString(), r.name]));
    res.json({
      success: true,
      foods: docs.map((f) => ({
        id: f._id.toString(),
        name: f.food_name || f.name || "",
        restaurant: f.restaurant_id ? restName.get(f.restaurant_id.toString()) || "" : "",
        category: f.category || "",
        price: Number(f.price || f.discounted_price || 0),
        stock: Number(f.stock || 0),
        is_available: f.is_available != null ? !!f.is_available : true,
        image: f.image || f.food_image || "",
        created_at: f.created_at ? new Date(f.created_at).toISOString() : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/categories — distinct categories with item counts.
adminRouter.get("/categories", async (req, res, next) => {
  try {
    const docs = await getDb().collection("food-collection").find({}).toArray();
    const counts = {};
    for (const f of docs) {
      const c = f.category || "Other";
      counts[c] = (counts[c] || 0) + 1;
    }
    res.json({
      success: true,
      categories: Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reviews — latest reviews joined with restaurant names.
adminRouter.get("/reviews", async (req, res, next) => {
  try {
    const db = getDb();
    const [docs, rests] = await Promise.all([
      db.collection("reviews").find({}).sort({ created_at: -1 }).limit(200).toArray(),
      db.collection("resturent-collection").find({}).toArray(),
    ]);
    const restName = new Map(rests.map((r) => [r._id.toString(), r.name]));
    const enriched = await enrichReviews(db, docs);
    res.json({
      success: true,
      reviews: enriched.map((r) => ({
        id: r._id ? r._id.toString() : String(r.created_at),
        name: r.user_name || r.name || "Customer",
        avatar_url: r.avatar_url || "",
        restaurant: r.restaurant_id ? restName.get(String(r.restaurant_id)) || "" : "",
        food: r.food_name || r.dish || "",
        rating: Number(r.rating || 0),
        text: r.text || r.review || "",
        image: r.food_image || "",
        created_at: r.created_at || r.created ? new Date(r.created_at || r.created).toISOString() : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/payments — payment breakdown + recent transactions.
adminRouter.get("/payments", async (req, res, next) => {
  try {
    const db = getDb();
    const docs = await db
      .collection("order-summary")
      .find({})
      .sort({ created_at: -1 })
      .limit(500)
      .toArray();
    const records = deliveredRevenueRecords(docs);

    // Platform "received" = 5% commission on each delivered sub-order.
    const byMethod = {};
    for (const r of records) {
      const m = r.paymentMethod || "Cash on Delivery";
      byMethod[m] = { total: (byMethod[m]?.total || 0) + r.adminCommission, count: (byMethod[m]?.count || 0) + 1 };
    }
    const total = round2(records.reduce((s, r) => s + r.adminCommission, 0));
    const restaurantPayout = round2(records.reduce((s, r) => s + r.restaurantPayout, 0));

    res.json({
      success: true,
      payments: {
        total_received: total,
        restaurant_payout: restaurantPayout,
        commission_rate: COMMISSION_RATE * 100,
        methods: Object.entries(byMethod).map(([method, v]) => ({
          method,
          total: Math.round(v.total * 100) / 100,
          count: v.count,
        })),
        recent: records.slice(0, 20).map((r) => ({
          id: r.subOrderId,
          sub_order_id: r.subOrderId,
          order_no: r.orderNo,
          customer: r.customer || "Customer",
          restaurant: r.restaurantName,
          restaurant_id: r.restaurantId,
          amount: r.adminCommission,
          subtotal: r.subtotal,
          restaurant_payout: r.restaurantPayout,
          method: r.paymentMethod || "Cash on Delivery",
          status: r.paymentStatus || (r.status === "Delivered" ? "Paid" : "Pending"),
          date: r.completedAt ? new Date(r.completedAt).toISOString() : null,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/notifications — persistent role-based admin feed (newest first).
adminRouter.get("/notifications", async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const notifications = await listAdminNotifications(limit);
    const unreadCount = await countUnreadAdminNotifications();
    res.json({
      success: true,
      notifications,
      unread_count: unreadCount,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/notifications/unread-count — badge count only.
adminRouter.get("/notifications/unread-count", async (req, res, next) => {
  try {
    const unreadCount = await countUnreadAdminNotifications();
    res.json({ success: true, unread_count: unreadCount });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/notifications — create a role-based notification
// (system/manual alerts for the admin feed).
adminRouter.post("/notifications", async (req, res, next) => {
  try {
    const input = req.body || {};
    const notification = await createAdminNotification({
      type: String(input.type || "system"),
      title: String(input.title || "").trim(),
      message: String(input.message || "").trim(),
      role: ["customer", "restaurantOwner", "rider"].includes(input.role)
        ? input.role
        : "customer",
      userId: input.userId || req.userData.id,
      userName: String(input.userName || req.userData.name || "Admin").trim(),
      relatedId: input.relatedId || null,
      relatedType: String(input.relatedType || ""),
      navigateTo: String(input.navigateTo || "/admin"),
      dedupeKey: input.dedupeKey || null,
    });
    if (!notification) {
      return res.status(500).json({ error: "Could not create notification." });
    }
    res.status(201).json({ success: true, notification });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/notifications/mark-all-read — reset the badge to 0.
// Defined before the :id route so "mark-all-read" never matches as an id.
adminRouter.patch("/notifications/mark-all-read", async (req, res, next) => {
  try {
    const result = await getDb()
      .collection("notifications")
      .updateMany(
        { target_role: "admin", isRead: false },
        { $set: { isRead: true, read_at: new Date() } }
      );
    res.json({ success: true, modified_count: result.modifiedCount || 0 });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/notifications/:id/read — mark a single notification read.
adminRouter.patch("/notifications/:id/read", async (req, res, next) => {
  try {
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: "Invalid notification id." });
    }
    const result = await getDb()
      .collection("notifications")
      .updateOne(
        { _id: id, target_role: "admin" },
        { $set: { isRead: true, read_at: new Date() } }
      );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Notification not found." });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/analytics — detailed platform analytics (charts).
adminRouter.get("/analytics", async (req, res, next) => {
  try {
    const db = getDb();
    const orders = await db.collection("order-summary").find({}).toArray();
    const revenueRecords = deliveredRevenueRecords(orders);
    const monthly = {};
    for (const r of revenueRecords) {
      const d = r.completedAt ? new Date(r.completedAt) : new Date(0);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { revenue: 0, orders: 0 };
      monthly[key].revenue += r.adminCommission;
      monthly[key].orders += 1;
    }
    const monthlyArr = Object.entries(monthly)
      .map(([month, v]) => ({ month, revenue: Math.round(v.revenue * 100) / 100, orders: v.orders }))
      .sort((a, b) => a.month.localeCompare(b.month));
    const byPayment = {};
    for (const r of revenueRecords) {
      const m = r.paymentMethod || "Cash on Delivery";
      byPayment[m] = (byPayment[m] || 0) + r.adminCommission;
    }
    const statusCounts = {};
    for (const o of orders) statusCounts[o.status || "Pending"] = (statusCounts[o.status || "Pending"] || 0) + 1;
    res.json({
      success: true,
      analytics: {
        total_orders: orders.length,
        total_revenue: round2(revenueRecords.reduce((s, r) => s + r.adminCommission, 0)),
        completed_orders: revenueRecords.length,
        commission_rate: COMMISSION_RATE * 100,
        monthly: monthlyArr,
        revenue_by_payment: byPayment,
        status_counts: statusCounts,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports — summary bundle for the Reports page.
adminRouter.get("/reports", async (req, res, next) => {
  try {
    const db = getDb();
    const orders = await db.collection("order-summary").find({}).toArray();
    const revenueRecords = deliveredRevenueRecords(orders);
    const totalRevenue = round2(
      revenueRecords.reduce((s, r) => s + r.adminCommission, 0)
    );
    const restaurantPayout = round2(
      revenueRecords.reduce((s, r) => s + r.restaurantPayout, 0)
    );
    const platformSales = round2(
      revenueRecords.reduce((s, r) => s + r.subtotal, 0)
    );
    res.json({
      success: true,
      report: {
        generated_at: new Date().toISOString(),
        total_orders: orders.length,
        total_revenue: totalRevenue,
        restaurant_payout: restaurantPayout,
        commission_rate: COMMISSION_RATE * 100,
        delivered_orders: revenueRecords.length,
        platform_sales: platformSales,
        avg_order_value:
          revenueRecords.length > 0
            ? round2(platformSales / revenueRecords.length)
            : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/settings — admin account + platform snapshot.
adminRouter.get("/settings", async (req, res, next) => {
  try {
    const db = getDb();
    const me = await db.collection("login").findOne({ _id: new ObjectId(req.userData.id) });
    res.json({
      success: true,
      settings: {
        name: me?.name || req.userData.name || "Administrator",
        email: me?.email || req.userData.email || "",
        avatar_url: me?.avatar_url || "",
        platform: {
          auto_approve_restaurants: false,
          auto_approve_riders: false,
          maintenance_mode: false,
          commission_rate: 10,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});
