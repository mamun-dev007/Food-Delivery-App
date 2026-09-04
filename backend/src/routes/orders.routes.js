import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo.js";
import { createAdminNotification } from "../services/notification.service.js";
import { buildSubOrders, round2 } from "../services/revenue.service.js";

const FOOD_COLLECTION = "food-collection";
const LOW_STOCK_THRESHOLD = 10;

// ============================================================
// Order number / tracking helpers
// ============================================================
function pad(n, len = 4) {
  return String(n).padStart(len, "0");
}

function makeOrderNo() {
  const d = new Date();
  const ymd = [
    d.getFullYear(),
    pad(d.getMonth() + 1, 2),
    pad(d.getDate(), 2),
  ].join("");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${ymd}-${rand}`;
}

function makeTrackingId() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TRK-${rand}`;
}

export const ordersRouter = Router();

// ============================================================
// Date-range helpers
// ============================================================
// Map the ?range= query param to a start-of-period timestamp.
// Everything is relative to "now" so the filter is always meaningful.
const RANGE_OFFSETS = {
  // Only today's orders (from 00:00:00 local server time)
  day: () => startOfDay(new Date()),
  // First day of the current month
  month: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  // First day of the current year
  year: () => new Date(new Date().getFullYear(), 0, 1),
};

function startOfDay(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getRangeStart(range) {
  const fn = RANGE_OFFSETS[range] || RANGE_OFFSETS.month;
  return fn();
}

// ============================================================
// GET /api/user/orders-summary?range=day|month|year
// ============================================================
// Returns:
//   range          echoed query param
//   from / to      used time bounds (for UI display)
//   total_spent    sum(total_amount) of NON-cancelled orders in range
//   total_orders   count of all orders in range
//   orders[]       detailed, newest-first order cards
//
// The userId is injected via the authenticated request. In this demo the
// JWT/store middleware would attach req.user; we read it from the header
// so the client can pass it (X-User-Id). In production, replace with the
// verified identity from your auth middleware.
//
// The query hits the `order-summary` collection using the composite index
// (user_id, created_at) for the range scan, then a $facet computes the
// aggregates and the detail rows in a single round-trip.
// ============================================================
ordersRouter.get("/orders-summary", async (req, res, next) => {
  const { range = "month" } = req.query;

  // Validate the range param (fail fast with a clean 400).
  if (!RANGE_OFFSETS[range]) {
    return res
      .status(400)
      .json({ error: "Invalid range. Use one of: day, month, year" });
  }

  // The user is guaranteed by verifyRole("customer") middleware mounted on
  // /api/user. req.userData.id is the REAL MongoDB user id from the verified
  // Firebase identity — the client-provided X-User-Id header is NOT trusted.
  const userId = req.userData.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  let userObjectId;
  try {
    userObjectId = new ObjectId(userId);
  } catch {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const from = getRangeStart(range);
  const to = new Date(); // "now"

  try {
    const db = getDb();
    const orders = db.collection("order-summary");

    // Scope: this user's orders within [from, to]. Uses (user_id, created_at).
    const match = {
      user_id: userObjectId,
      created_at: { $gte: from, $lte: to },
    };

    // GROUP BY status in the analytics facet so we can exclude cancelled
    // amounts from total_spent without losing cancelled orders from count.
    const [{ analytics, details }] = await orders
      .aggregate([
        { $match: match },
        {
          $facet: {
            analytics: [
              {
                $group: {
                  _id: "$status",
                  spent: { $sum: "$total_amount" },
                  count: { $sum: 1 },
                },
              },
            ],
            details: [
              // newest first
              { $sort: { created_at: -1 } },
              // Map DB fields to the exact shape the front-end order cards
              // expect: logo_url (not restaurant_logo) and item_name (the
              // item field the UI renders).
              {
                $project: {
                  id: "$_id",
                  _id: 0,
                  order_no: 1,
                  tracking_id: 1,
                  restaurant_id: 1,
                  restaurant_name: 1,
                  logo_url: "$restaurant_logo",
                  status: 1,
                  created_at: 1,
                  subtotal: 1,
                  delivery_fee: 1,
                  total_amount: 1,
                  items: {
                    $map: {
                      input: "$items",
                      as: "it",
                      in: {
                        item_name: "$$it.food_name",
                        quantity: "$$it.quantity",
                        unit_price: "$$it.unit_price",
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    // total_orders = all statuses; total_spent = exclude cancelled.
    const total_orders = analytics.reduce((s, g) => s + g.count, 0);
    const cancelled = analytics.find((g) => g._id === "Cancelled");
    const total_spent =
      analytics.reduce((s, g) => s + (g.spent || 0), 0) -
      (cancelled ? cancelled.spent : 0);

    // Make items consistent with the UI shape (already numeric).
    res.json({
      range,
      from: from.toISOString(),
      to: to.toISOString(),
      total_spent: Math.round(total_spent * 100) / 100,
      total_orders,
      orders: details,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/user/orders
// ============================================================
// Creates a new order for the authenticated customer. The customer is derived
// from the verified Firebase token (req.userData), never from the request body.
//
// Body (all validated on the backend):
//   restaurant:  { id, name, logo }            (optional when items carry one)
//   items:       [{ food_id, name, image, qty, unit_price, restaurant? }]
//   subtotal, discount, delivery_fee, payment_method, note
//   delivery:    { name, phone, house, road_area, city, instructions }
//
// An order may span multiple restaurants: each line item can carry its own
// `restaurant` object (each cart item embeds one). The backend groups the
// items per restaurant into `sub_orders[]` — one record per restaurant with
// its own subtotal / fees / totals / 5% adminCommission / 95% restaurantRevenue.
// Top-level totals remain the combined customer-facing figures.
//
// Writes the order to the `order-summary` collection (matching the seed shape
// as closely as possible) plus a matching `payment-intg` record, and returns
// the full order with a human-readable order_no (used for /invoice/:orderNo).
// ============================================================
ordersRouter.post("/orders", async (req, res, next) => {
  try {
    const userId = req.userData.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const primaryRestaurant =
      body.restaurant || (items[0] && items[0].restaurant) || {};
    const delivery = body.delivery || {};

    // ---- validation ----
    if (items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }
    const anyRestaurant = items.some((it) => it.restaurant && it.restaurant.id != null);
    if (!primaryRestaurant.name && !anyRestaurant) {
      return res.status(400).json({ error: "Restaurant information is required." });
    }
    if (!delivery.address || !delivery.phone) {
      return res.status(400).json({ error: "Delivery address and phone are required." });
    }

    // Rebuild totals server-side so a client can't understate the price.
    let subtotal = 0;
    const cleanItems = items.map((it) => {
      const unit_price = Math.max(0, Number(it.unit_price) || 0);
      const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
      subtotal += unit_price * qty;
      return {
        food_id: it.food_id != null ? String(it.food_id) : null,
        food_name: String(it.name || ""),
        image: it.image || "",
        quantity: qty,
        unit_price: Math.round(unit_price * 100) / 100,
        restaurant:
          it.restaurant && it.restaurant.id != null
            ? it.restaurant
            : primaryRestaurant,
      };
    });
    subtotal = Math.round(subtotal * 100) / 100;

    const discount = Math.max(0, Math.round((Number(body.discount) || 0) * 100) / 100);
    // Delivery charge is always 10% of the subtotal (computed server-side).
    const delivery_fee = Math.round(subtotal * 0.1 * 100) / 100;
    const total_amount = Math.round((subtotal + delivery_fee - discount) * 100) / 100;

    const now = new Date();
    const order_no = makeOrderNo();
    const tracking_id = makeTrackingId();

    // Per-restaurant sub-orders: each restaurant's share of delivery fee and
    // discount is split proportionally; revenue split is 5% / 95% of the
    // restaurant's subtotal (invariant subtotal = commission + payout).
    const sub_orders = buildSubOrders({
      items: cleanItems,
      primaryRestaurant,
      subtotal,
      deliveryFee: delivery_fee,
      discount,
    });

    const restaurant_name = sub_orders
      .map((s) => s.restaurant_name)
      .filter(Boolean)
      .join(", ");
    const restaurant_count = sub_orders.length;

    const orderDoc = {
      user_id: new ObjectId(userId),
      order_no,
      tracking_id,
      restaurant_id:
        sub_orders.length === 1 ? sub_orders[0].restaurant_id : null,
      restaurant_name,
      restaurant_logo: sub_orders[0] ? sub_orders[0].restaurant_logo : "",
      restaurant_count,
      sub_orders,
      items: cleanItems,
      subtotal,
      discount,
      delivery_fee,
      total_amount,
      payment_method: String(body.payment_method || "Cash on Delivery"),
      payment_status: "Pending",
      order_note: String(body.note || ""),
      delivery: {
        name: String(delivery.name || req.userData.name || ""),
        phone: String(delivery.phone || ""),
        address: String(delivery.address || ""),
        city: String(delivery.city || ""),
        instructions: String(delivery.instructions || ""),
      },
      status: "Pending",
      created_at: now,
      updated_at: now,
    };

    // Persist the applied coupon code (if any) and bump its usage so the
    // max_usage limit is enforced over time. Non-blocking: admin sets usage.
    const appliedCoupon = body.coupon?.code ? String(body.coupon.code).toUpperCase() : null;
    if (appliedCoupon) orderDoc.coupon_code = appliedCoupon;

    const db = getDb();
    const orders = db.collection("order-summary");
    const result = await orders.insertOne(orderDoc);

    if (appliedCoupon) {
      try {
        await db
          .collection("coupons")
          .updateOne({ code: appliedCoupon }, { $inc: { usage: 1 } });
      } catch (e) {
        console.warn("Failed to increment coupon usage:", e.message);
      }
    }

    // Stock tracking + low-stock alerts. Every ordered quantity is removed
    // from the restaurant's food stock; the moment an item drops below the
    // low-stock threshold, a notification is created immediately.
    try {
      const foods = db.collection(FOOD_COLLECTION);
      const notifications = db.collection("notifications");
      for (const it of cleanItems) {
        if (!it.food_id || !ObjectId.isValid(it.food_id)) continue;
        const qty = Math.max(0, Number(it.quantity) || 1);
        if (qty === 0) continue;
        const food = await foods.findOne({ _id: new ObjectId(it.food_id) });
        if (!food) continue;
        const before = Math.max(0, Number(food.stock) || 0);
        const after = Math.max(0, before - qty);
        await foods.updateOne(
          { _id: new ObjectId(it.food_id) },
          { $inc: { stock: -qty }, $set: { updated_at: now } }
        );
        if (before >= LOW_STOCK_THRESHOLD && after < LOW_STOCK_THRESHOLD) {
          const foodName = food.food_name || food.name || "a food";
          await notifications.insertOne({
            type: "stock",
            title: "Low stock alert",
            message: `"${foodName}" is low (${after} left).`,
            restaurant_id: String(food.restaurant_id || ""),
            food_id: String(food._id),
            food_name: foodName,
            created_at: now,
            seen: false,
          });
        }
      }
    } catch (e) {
      console.warn("Failed to decrement food stock:", e.message);
    }

    // Payment record for the invoice's payment details.
    try {
      const payments = db.collection("payment-intg");
      await payments.insertOne({
        order_id: result.insertedId,
        user_id: new ObjectId(userId),
        method: orderDoc.payment_method,
        amount: total_amount,
        currency: "BDT",
        status: orderDoc.payment_status,
        transaction_id: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
        gateway_response: {},
        created_at: now,
      });
    } catch (e) {
      // Payment record is auxiliary; don't fail the whole order on it.
      console.warn("Failed to write payment record:", e.message);
    }

    // Role-based admin notification for the newly placed order.
    try {
      await createAdminNotification({
        type: "order",
        title: "New order received",
        message: `${orderDoc.delivery.name || req.userData.name || "A customer"} placed order ${order_no} at ${orderDoc.restaurant_name || "a restaurant"}.`,
        role: "customer",
        userId,
        userName: orderDoc.delivery.name || req.userData.name || "",
        relatedId: order_no,
        relatedType: "order",
        navigateTo: "/admin/orders",
        dedupeKey: `order_placed_${result.insertedId}`,
      });
    } catch (e) {
      console.warn("Failed to create admin notification:", e.message);
    }

    res.status(201).json({
      success: true,
      order: {
        id: result.insertedId.toString(),
        order_no,
        tracking_id,
        restaurant_id: orderDoc.restaurant_id,
        restaurant_name: orderDoc.restaurant_name,
        restaurant_logo: orderDoc.restaurant_logo,
        restaurant_count,
        sub_orders,
        items: cleanItems,
        subtotal,
        discount,
        delivery_fee,
        total_amount,
        payment_method: orderDoc.payment_method,
        payment_status: orderDoc.payment_status,
        order_note: orderDoc.order_note,
        delivery: orderDoc.delivery,
        status: orderDoc.status,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/user/orders/:orderNo
// ============================================================
// Fetch a single order by its human-readable order_no (e.g. ORD-20260904-1234)
// so the Invoice page can render it. Scoped to the authenticated customer.
// ============================================================
ordersRouter.get("/orders/:orderNo", async (req, res, next) => {
  try {
    const userId = req.userData.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const orderNo = String(req.params.orderNo || "");
    if (!orderNo) {
      return res.status(400).json({ error: "Order id is required" });
    }

    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const db = getDb();
    const orders = db.collection("order-summary");

    // Match by the human-readable order_no OR the raw MongoDB _id, so both
    // `order_no` links and `id`-based links resolve from the track page.
    let orderId;
    try {
      orderId = new ObjectId(orderNo);
    } catch {
      orderId = null;
    }

    const doc = await orders.findOne({
      user_id: userObjectId,
      $or: [
        { order_no: orderNo },
        ...(orderId ? [{ _id: orderId }] : []),
      ],
    });

    if (!doc) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      success: true,
      order: {
        id: doc._id.toString(),
        order_no: doc.order_no,
        tracking_id: doc.tracking_id,
        restaurant_id: doc.restaurant_id,
        restaurant_name: doc.restaurant_name,
        restaurant_logo: doc.restaurant_logo,
        restaurant_count: doc.restaurant_count,
        sub_orders: doc.sub_orders || null,
        items: doc.items,
        subtotal: doc.subtotal,
        discount: doc.discount || 0,
        delivery_fee: doc.delivery_fee,
        total_amount: doc.total_amount,
        payment_method: doc.payment_method,
        payment_status: doc.payment_status,
        order_note: doc.order_note || "",
        delivery: doc.delivery || {},
        status: doc.status,
        created_at: (doc.created_at || doc.updated_at || new Date()).toISOString(),
        updated_at: (doc.updated_at || doc.created_at || new Date()).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});
