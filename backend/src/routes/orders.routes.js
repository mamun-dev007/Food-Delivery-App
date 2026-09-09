import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo.js";
import { createAdminNotification } from "../services/notification.service.js";
import { buildSubOrders, round2 } from "../services/revenue.service.js";

const FOOD_COLLECTION = "food-collection";
const LOW_STOCK_THRESHOLD = 10;
const INTENT_TTL_MS = 30 * 60 * 1000; // a payment session expires after 30 min

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

function randomTxnId() {
  return `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
}

// Resolve the authenticated user id (from the verified Firebase token) or
// respond with a 401/400 and return null.
function resolveUser(req, res) {
  const userId = req.userData?.id;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  let userObjectId;
  try {
    userObjectId = new ObjectId(userId);
  } catch {
    res.status(400).json({ error: "Invalid user id" });
    return null;
  }
  return { userId, userObjectId };
}

// Map a stored order-summary doc to the exact JSON shape the frontend consumes
// on the Invoice + payment pages.
function toOrderJson(doc) {
  return {
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
  };
}

// Shape of a payment intent for the Stripe-style checkout page.
function toIntentJson(intent) {
  const od = intent.order_doc || {};
  return {
    order_no: intent.order_no,
    tracking_id: intent.tracking_id,
    restaurant_name: od.restaurant_name,
    restaurant_logo: od.restaurant_logo,
    items: od.items,
    subtotal: od.subtotal,
    discount: od.discount,
    delivery_fee: od.delivery_fee,
    total_amount: od.total_amount,
    payment_method: od.payment_method,
    payment_status: intent.status === "paid" ? "Paid" : "Pending",
    delivery: od.delivery,
    created_at: (intent.created_at || new Date()).toISOString(),
  };
}

// Validate + normalise an order payload into the order-summary document shape.
// Returns { errors: [msg] } on validation failure, otherwise
// { orderDoc, cleanItems, appliedCoupon, now }.
function buildOrderPayload({ userObjectId, body, userName }) {
  const items = Array.isArray(body.items) ? body.items : [];
  const primaryRestaurant =
    body.restaurant || (items[0] && items[0].restaurant) || {};
  const delivery = body.delivery || {};

  // ---- validation (fast-fail on the first error) ----
  if (items.length === 0) return { errors: ["Cart is empty."] };
  const anyRestaurant = items.some(
    (it) => it.restaurant && it.restaurant.id != null
  );
  if (!primaryRestaurant.name && !anyRestaurant) {
    return { errors: ["Restaurant information is required."] };
  }
  if (!delivery.address || !delivery.phone) {
    return { errors: ["Delivery address and phone are required."] };
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

  const discount =
    Math.max(0, Math.round((Number(body.discount) || 0) * 100) / 100);
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
    user_id: userObjectId,
    order_no,
    tracking_id,
    restaurant_id: sub_orders.length === 1 ? sub_orders[0].restaurant_id : null,
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
      name: String(delivery.name || userName || ""),
      phone: String(delivery.phone || ""),
      address: String(delivery.address || ""),
      city: String(delivery.city || ""),
      instructions: String(delivery.instructions || ""),
    },
    status: "Pending",
    created_at: now,
    updated_at: now,
  };

  // Persist the applied coupon code (if any) so max_usage can be bumped later.
  const appliedCoupon = body.coupon?.code
    ? String(body.coupon.code).toUpperCase()
    : null;
  if (appliedCoupon) orderDoc.coupon_code = appliedCoupon;

  return { orderDoc, cleanItems, appliedCoupon, now };
}

// Order side-effects that only run once an order is actually created
// (i.e. on COD placement or on successful online-payment confirmation):
// coupon usage, stock decrement + low-stock alerts, and the admin notification.
async function runOrderSideEffects({
  db,
  orderDoc,
  cleanItems,
  appliedCoupon,
  insertedId,
  userId,
  userName,
}) {
  if (appliedCoupon) {
    try {
      await db
        .collection("coupons")
        .updateOne({ code: appliedCoupon }, { $inc: { usage: 1 } });
    } catch (e) {
      console.warn("Failed to increment coupon usage:", e.message);
    }
  }

  // Stock tracking + low-stock alerts.
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
        { $inc: { stock: -qty }, $set: { updated_at: orderDoc.updated_at } }
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
          created_at: orderDoc.updated_at,
          seen: false,
        });
      }
    }
  } catch (e) {
    console.warn("Failed to decrement food stock:", e.message);
  }

  // Role-based admin notification for the newly placed order.
  try {
    await createAdminNotification({
      type: "order",
      title: "New order received",
      message: `${orderDoc.delivery.name || userName || "A customer"} placed order ${orderDoc.order_no} at ${orderDoc.restaurant_name || "a restaurant"}.`,
      role: "customer",
      userId,
      userName: orderDoc.delivery.name || userName || "",
      relatedId: orderDoc.order_no,
      relatedType: "order",
      navigateTo: "/admin/orders",
      dedupeKey: `order_placed_${insertedId}`,
    });
  } catch (e) {
    console.warn("Failed to create admin notification:", e.message);
  }
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

  const who = resolveUser(req, res);
  if (!who) return;

  const from = getRangeStart(range);
  const to = new Date(); // "now"

  try {
    const db = getDb();
    const orders = db.collection("order-summary");

    // Scope: this user's orders within [from, to]. Uses (user_id, created_at).
    const match = {
      user_id: who.userObjectId,
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
// Creates a new order IMMEDIATELY (Cash on Delivery flow).
// Online methods (bKash / Nagad / Card) do NOT use this route — they first
// create a payment intent (/payments/intent) and the order only becomes real
// once the customer confirms payment (/payments/:orderNo/confirm).
//
// Body (all validated on the backend):
//   restaurant:  { id, name, logo }            (optional when items carry one)
//   items:       [{ food_id, name, image, qty, unit_price, restaurant? }]
//   subtotal, discount, delivery_fee, payment_method, note
//   delivery:    { name, phone, house, road_area, city, instructions }
// ============================================================
ordersRouter.post("/orders", async (req, res, next) => {
  try {
    const who = resolveUser(req, res);
    if (!who) return;

    const built = buildOrderPayload({
      userObjectId: who.userObjectId,
      body: req.body || {},
      userName: req.userData.name || "",
    });
    if (built.errors) {
      return res.status(400).json({ error: built.errors[0] });
    }

    const { orderDoc, cleanItems, appliedCoupon } = built;
    const db = getDb();
    const orders = db.collection("order-summary");
    const result = await orders.insertOne(orderDoc);

    await runOrderSideEffects({
      db,
      orderDoc,
      cleanItems,
      appliedCoupon,
      insertedId: result.insertedId,
      userId: who.userId,
      userName: req.userData.name || "",
    });

    // Payment record for the invoice's payment details.
    try {
      const payments = db.collection("payment-intg");
      await payments.insertOne({
        order_id: result.insertedId,
        user_id: who.userObjectId,
        method: orderDoc.payment_method,
        amount: orderDoc.total_amount,
        currency: "BDT",
        status: orderDoc.payment_status,
        transaction_id: randomTxnId(),
        gateway_response: {},
        created_at: orderDoc.created_at,
      });
    } catch (e) {
      // Payment record is auxiliary; don't fail the whole order on it.
      console.warn("Failed to write payment record:", e.message);
    }

    orderDoc._id = result.insertedId;
    res.status(201).json({ success: true, order: toOrderJson(orderDoc) });
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
    const who = resolveUser(req, res);
    if (!who) return;

    const orderNo = String(req.params.orderNo || "");
    if (!orderNo) {
      return res.status(400).json({ error: "Order id is required" });
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
      user_id: who.userObjectId,
      $or: [
        { order_no: orderNo },
        ...(orderId ? [{ _id: orderId }] : []),
      ],
    });

    if (!doc) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true, order: toOrderJson(doc) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/user/payments/intent
// ============================================================
// Online checkout (bKash / Nagad / Card): reserves the order WITHOUT writing it
// to order-summary. No real order exists until /payments/:orderNo/confirm is
// called — so an order is only ever confirmed once the customer actually pays.
// ============================================================
ordersRouter.post("/payments/intent", async (req, res, next) => {
  try {
    const who = resolveUser(req, res);
    if (!who) return;

    const built = buildOrderPayload({
      userObjectId: who.userObjectId,
      body: req.body || {},
      userName: req.userData.name || "",
    });
    if (built.errors) {
      return res.status(400).json({ error: built.errors[0] });
    }

    const { orderDoc } = built;
    const now = orderDoc.created_at;

    const db = getDb();
    const payments = db.collection("payment-intg");

    // Drop any older pending intents for the same checkout payload/method so a
    // retry always operates on the freshest session.
    try {
      await payments.deleteMany({
        doc_type: "intent",
        status: "pending",
        user_id: who.userObjectId,
        expires_at: { $lt: now },
      });
    } catch (e) {
      console.warn("Failed to clean expired intents:", e.message);
    }

    const intent = {
      doc_type: "intent",
      // The payment-intg collection has a UNIQUE index on order_id, so intents
      // (which have no real order yet) need a unique placeholder value.
      order_id: new ObjectId(),
      order_no: orderDoc.order_no,
      tracking_id: orderDoc.tracking_id,
      user_id: orderDoc.user_id,
      order_doc: orderDoc,
      method: orderDoc.payment_method,
      currency: "BDT",
      amount: orderDoc.total_amount,
      status: "pending",
      transaction_id: randomTxnId(),
      gateway_response: {},
      created_at: now,
      expires_at: new Date(now.getTime() + INTENT_TTL_MS),
    };

    await payments.insertOne(intent);

    res.status(201).json({ success: true, intent: toIntentJson(intent) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /api/user/payments/:orderNo
// ============================================================
// Fetch the payment intent for the Stripe-style checkout page (items, totals,
// method). Returns payment_status "Paid" once the order has been confirmed so
// the page can forward already-paid orders to the invoice.
// ============================================================
ordersRouter.get("/payments/:orderNo", async (req, res, next) => {
  try {
    const who = resolveUser(req, res);
    if (!who) return;

    const orderNo = String(req.params.orderNo || "");
    if (!orderNo) {
      return res.status(400).json({ error: "Order id is required" });
    }

    const db = getDb();
    const intent = await db.collection("payment-intg").findOne({
      doc_type: "intent",
      user_id: who.userObjectId,
      order_no: orderNo,
    });

    if (!intent) {
      return res.status(404).json({ error: "Payment intent not found" });
    }

    res.json({ success: true, order: toIntentJson(intent) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/user/payments/:orderNo/confirm
// ============================================================
// The final step after the customer taps "Pay now" on the secure checkout page.
// Confirms the payment, writes the REAL order to order-summary (paid), and runs
// all order side effects (stock, coupon usage, notifications). Without this
// call the order is never created — Pay-button-less checkouts leave nothing.
// ============================================================
ordersRouter.post("/payments/:orderNo/confirm", async (req, res, next) => {
  try {
    const who = resolveUser(req, res);
    if (!who) return;

    const orderNo = String(req.params.orderNo || "");
    if (!orderNo) {
      return res.status(400).json({ error: "Order id is required" });
    }

    const db = getDb();
    const payments = db.collection("payment-intg");

    const intent = await payments.findOne({
      doc_type: "intent",
      user_id: who.userObjectId,
      order_no: orderNo,
    });
    if (!intent) {
      return res.status(404).json({ error: "Payment intent not found" });
    }

    // Already paid → return the existing order idempotently.
    if (intent.status === "paid") {
      const existing = await db
        .collection("order-summary")
        .findOne({ order_no: orderNo, user_id: who.userObjectId });
      if (!existing) {
        return res.status(404).json({ error: "Order not found" });
      }
      return res.json({
        success: true,
        alreadyPaid: true,
        order: toOrderJson(existing),
      });
    }

    // Expired sessions can't be paid anymore.
    if (new Date(intent.expires_at) < new Date()) {
      try {
        await payments.updateOne(
          { _id: intent._id },
          { $set: { status: "expired", updated_at: new Date() } }
        );
      } catch (e) {
        console.warn("Failed to mark intent expired:", e.message);
      }
      return res.status(400).json({
        error: "Payment session expired. Please place your order again.",
      });
    }

    const now = new Date();
    const orderDoc = intent.order_doc;
    orderDoc.payment_status = "Paid";
    orderDoc.payment_date = now;
    orderDoc.transaction_id = intent.transaction_id;
    orderDoc.updated_at = now;

    const orders = db.collection("order-summary");
    const result = await orders.insertOne(orderDoc);

    await runOrderSideEffects({
      db,
      orderDoc,
      cleanItems: orderDoc.items,
      appliedCoupon: orderDoc.coupon_code || null,
      insertedId: result.insertedId,
      userId: who.userId,
      userName: orderDoc.delivery?.name || "",
    });

    try {
      await payments.updateOne(
        { _id: intent._id },
        {
          $set: {
            status: "paid",
            order_id: result.insertedId,
            paid_at: now,
            updated_at: now,
          },
        }
      );
    } catch (e) {
      console.warn("Failed to update payment intent:", e.message);
    }

    orderDoc._id = result.insertedId;
    res.json({ success: true, alreadyPaid: false, order: toOrderJson(orderDoc) });
  } catch (err) {
    next(err);
  }
});