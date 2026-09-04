// ============================================================
// MongoDB index setup for the Food-Delivery001 database
// Run once: `npm run setup`
// Creates the 5 collections and the indexes that make the
// order-summary analytics query fast on Atlas.
//
// Collections (fixed names):
//   food-collection        menu items
//   login                  user accounts
//   order-summary          orders (history + analytics)
//   payment-intg           payments
//   resturent-collection   restaurants
// ============================================================
import { connectToDatabase, client } from "./mongo.js";

const COLLECTIONS = [
  "food-collection",
  "login",
  "order-summary",
  "payment-intg",
  "resturent-collection",
  "notifications",
  "reviews",
  "coupons",
];

async function setupIndexes() {
  const db = await connectToDatabase();

  // Ensure all collections exist.
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name);
      console.log(`✓ collection ready: ${name}`);
    } catch {
      // already exists
    }
  }

  // ---- login ----
  const login = db.collection("login");
  await login.createIndex({ email: 1 }, { unique: true });
  await login.createIndex({ uid: 1 }, { unique: true, sparse: true });
  await login.createIndex({ phoneNumber: 1 }, { unique: true, sparse: true });
  await login.createIndex({ role: 1 });
  await login.createIndex({ status: 1 });
  await login.createIndex({ district: 1 });

  // ---- resturent-collection ----
  const restaurants = db.collection("resturent-collection");
  await restaurants.createIndex({ owner_login_id: 1 });

  // ---- food-collection ----
  const foods = db.collection("food-collection");
  await foods.createIndex({ restaurant_id: 1 });
  await foods.createIndex({ category: 1 });

  // ---- order-summary ----
  const orders = db.collection("order-summary");
  // PRIMARY: per-user date-range scans (the analytics access path).
  await orders.createIndex({ user_id: 1, created_at: -1 });
  // Covering index for status-filtered range queries.
  await orders.createIndex({ user_id: 1, created_at: -1, status: 1 });
  // Lookup helpers.
  await orders.createIndex({ restaurant_id: 1 });
  await orders.createIndex({ "sub_orders.restaurant_id": 1 });
  await orders.createIndex({ status: 1 });
  await orders.createIndex({ rider_id: 1 });
  await orders.createIndex({ rider_id: 1, created_at: -1 });

  // ---- reviews ----
  const reviews = db.collection("reviews");
  await reviews.createIndex({ restaurant_name: 1 });
  await reviews.createIndex({ dish: 1 });
  await reviews.createIndex({ created_at: -1 });

  // ---- coupons ----
  const coupons = db.collection("coupons");
  await coupons.createIndex({ code: 1 }, { unique: true });
  await coupons.createIndex({ active: 1 });

  // ---- payment-intg ----
  const payments = db.collection("payment-intg");
  await payments.createIndex({ order_id: 1 }, { unique: true });
  await payments.createIndex({ user_id: 1 });

  // ---- notifications ----
  // Admin role-based feed reads target_role admin, newest first, and counts
  // unread. Owner stock alerts also live here (filtered by restaurant_id).
  const notifications = db.collection("notifications");
  await notifications.createIndex({ target_role: 1, createdAt: -1 });
  await notifications.createIndex({ target_role: 1, isRead: 1 });
  await notifications.createIndex({ dedupeKey: 1 });
  await notifications.createIndex({ restaurant_id: 1 });

  console.log("✓ indexes created");

  await client.close();
  console.log("Setup complete.");
}

setupIndexes().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
