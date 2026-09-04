// ============================================================
// Seed notifications — generates the persistent role-based admin
// notification feed from the REAL data already in the DB (orders,
// users, restaurants, reviews). Idempotent: every row uses a
// deterministic dedupeKey, so re-running never creates duplicates.
//
// Run:  npm run seed:notifications
// ============================================================
import { connectToDatabase, client } from "./mongo.js";
import { createAdminNotification } from "../services/notification.service.js";

async function seedNotifications() {
  const db = await connectToDatabase();
  const notifications = db.collection("notifications");
  const orders = db.collection("order-summary");
  const login = db.collection("login");
  const restaurants = db.collection("resturent-collection");
  const foods = db.collection("food-collection");
  const reviews = db.collection("reviews");

  // ---- orders: new/received/delivered/cancelled ----
  const recentOrders = await orders
    .find({})
    .sort({ created_at: -1 })
    .limit(16)
    .toArray();

  for (const o of recentOrders) {
    const who = o.delivery?.name || "a customer";
    const no = o.order_no || o._id.toString();
    const status = o.status || "Pending";

    let plan;
    if (status === "Delivered") {
      plan = {
        type: "delivery",
        title: "Delivery completed",
        message: `Order ${no} was delivered to ${who}.`,
        navigateTo: "/admin/orders",
      };
    } else if (status === "Cancelled") {
      plan = {
        type: "order",
        title: "Order cancelled",
        message: `Order ${no} (${o.restaurant_name || "a restaurant"}) was cancelled.`,
        navigateTo: "/admin/orders",
      };
    } else {
      plan = {
        type: "order",
        title: "New order received",
        message: `${who} placed order ${no} at ${o.restaurant_name || "a restaurant"}.`,
        navigateTo: "/admin/orders",
      };
    }

    await createAdminNotification({
      ...plan,
      role: "customer",
      userName: who === "a customer" ? "" : who,
      relatedId: o.order_no ? o.order_no : o._id.toString(),
      relatedType: "order",
      dedupeKey: status === "Delivered" ? `order_delivered_${o._id}` : status === "Cancelled" ? `order_cancelled_${o.order_no || o._id}` : `order_placed_${o._id}`,
      createdAt: o.created_at || o.updated_at,
    });
  }

  // ---- registrations: newest users across roles ----
  const users = await login.find({}).sort({ created_at: -1 }).limit(30).toArray();
  for (const u of users) {
    let plan;
    if (u.role === "restaurantOwner") {
      const biz =
        (u.restaurant_id &&
          (await restaurants.findOne({ _id: u.restaurant_id }))) ??
        null;
      plan = {
        type: "restaurant",
        title: "Participating restaurant",
        message: `${u.name} owns ${biz?.name || "a restaurant"}.`,
        navigateTo: "/admin/restaurants",
      };
    } else if (u.role === "rider") {
      plan = {
        type: "rider",
        title: "Rider fleet member",
        message: `${u.name} is a registered rider.`,
        navigateTo: "/admin/riders",
      };
    } else if (u.role === "customer") {
      plan = {
        type: "customer",
        title: "Platform customer",
        message: `${u.name} is a registered customer.`,
        navigateTo: "/admin/users",
      };
    } else {
      continue; // admin accounts are not feed-worthy
    }
    await createAdminNotification({
      ...plan,
      role: u.role,
      userName: u.name || "",
      relatedId: u._id.toString(),
      relatedType: "user",
      dedupeKey: `signup_${u._id}`,
      createdAt: u.created_at || u.updated_at,
    });
  }

  // ---- newest food additions ----
  const recentFoods = await foods
    .find({})
    .sort({ created_at: -1 })
    .limit(6)
    .toArray();
  for (const f of recentFoods) {
    await createAdminNotification({
      type: "food",
      title: "Menu item",
      message: `${f.food_name || f.name || "A food"} · ${f.restaurant_name || "some restaurant"}`,
      role: "restaurantOwner",
      userName: f.restaurant_name || "",
      relatedId: f._id.toString(),
      relatedType: "food",
      navigateTo: "/admin/foods",
      dedupeKey: `food_submitted_${f._id}`,
      createdAt: f.created_at || f.updated_at,
    });
  }

  // ---- reviews / complaints ----
  const latestReviews = await reviews
    .find({})
    .sort({ created_at: -1 })
    .limit(6)
    .toArray();
  for (const r of latestReviews) {
    const rating = Number(r.rating || 0);
    const low = rating <= 2;
    await createAdminNotification({
      type: low ? "complaint" : "review",
      title: low ? "Customer complaint" : "Customer feedback",
      message: `${r.user_name || "A customer"} rated "${r.dish || "a dish"}" ${rating}/5.`,
      role: "customer",
      userName: r.user_name || "",
      relatedId: r._id.toString(),
      relatedType: "review",
      navigateTo: "/admin/reviews",
      dedupeKey: `review_submitted_${r._id}`,
      createdAt: r.created_at || r.created,
    });
  }

  // ---- mark the oldest 60% as read so the feed looks lived-in ----
  const all = await notifications
    .find({ target_role: "admin", isRead: false })
    .sort({ createdAt: -1 })
    .toArray();
  const oldestToRead = all.slice(Math.max(3, Math.floor(all.length * 0.6)));
  if (oldestToRead.length) {
    await notifications.updateMany(
      { _id: { $in: oldestToRead.map((n) => n._id) } },
      { $set: { isRead: true } }
    );
  }

  const unread = await notifications.countDocuments({
    target_role: "admin",
    isRead: false,
  });
  console.log("✓ notifications (admin feed):", all.length, "total,", unread, "unread");
  console.log("Seed notifications complete.");

  await client.close();
}

seedNotifications().catch((err) => {
  console.error("Seed notifications failed:", err);
  process.exit(1);
});