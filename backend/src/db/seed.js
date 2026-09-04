// ============================================================
// Seed script — populates Food-Delivery001 with realistic data
// across the 5 collections so the API and UI have something to show.
// Run once: `npm run seed`
//
// Collections populated:
//   login                  1 admin + customers + restaurant owners
//   resturent-collection   several restaurants
//   food-collection        menu items per restaurant
//   order-summary          orders (varied dates/status for analytics)
//   payment-intg           payment record per order
// ============================================================
import { ObjectId } from "mongodb";
import { connectToDatabase, client } from "./mongo.js";

// ---------- helpers ----------
// Relative dates so the analytics "day | month | year" filters always
// have data. Some orders land today/this month, others drift into the past.
const DAY = 24 * 60 * 60 * 1000;
const now = new Date();

function daysAgo(n) {
  return new Date(now.getTime() - n * DAY);
}
function hoursAgo(n) {
  return new Date(now.getTime() - n * 60 * 60 * 1000);
}

// ---------- seed ----------
async function seed() {
  const db = await connectToDatabase();

  const login = db.collection("login");
  const restaurants = db.collection("resturent-collection");
  const foods = db.collection("food-collection");
  const orders = db.collection("order-summary");
  const payments = db.collection("payment-intg");

  // Fresh start for deterministic seeds.
  await Promise.all([
    login.deleteMany({}),
    restaurants.deleteMany({}),
    foods.deleteMany({}),
    orders.deleteMany({}),
    payments.deleteMany({}),
  ]);

  // ---------- login ----------
  // The demo customer the front-end analytics screen uses (X-User-Id).
  const mamun = {
    _id: new ObjectId(),
    name: "Mamun Ahmed",
    email: "mamun@example.com",
    phone: "+8801700000001",
    role: "customer",
    status: "active",
    password_hash: "$2b$10$demo_password_hash_placeholder",
    avatar_url: "https://via.placeholder.com/150",
    restaurant_id: null,
    created_at: daysAgo(200),
    updated_at: daysAgo(20),
  };

  const customer2 = {
    _id: new ObjectId(),
    name: "Rafi Khan",
    email: "rafi@example.com",
    phone: "+8801700000002",
    role: "customer",
    status: "active",
    password_hash: "$2b$10$demo_password_hash_placeholder",
    avatar_url: "https://via.placeholder.com/150",
    restaurant_id: null,
    created_at: daysAgo(150),
    updated_at: daysAgo(10),
  };

  const owner1 = {
    _id: new ObjectId(),
    name: "Sadia Rahman",
    email: "sadia@mamunkitchen.com",
    phone: "+8801700000003",
    role: "restaurantOwner",
    status: "active",
    password_hash: "$2b$10$demo_password_hash_placeholder",
    avatar_url: "https://via.placeholder.com/150",
    restaurant_id: null, // linked below
    created_at: daysAgo(300),
    updated_at: daysAgo(120),
  };

  const owner2 = {
    _id: new ObjectId(),
    name: "Tanvir Islam",
    email: "tanvir@spicegarden.com",
    phone: "+8801700000004",
    role: "restaurantOwner",
    status: "active",
    password_hash: "$2b$10$demo_password_hash_placeholder",
    avatar_url: "https://via.placeholder.com/150",
    restaurant_id: null,
    created_at: daysAgo(280),
    updated_at: daysAgo(90),
  };

  const admin = {
    _id: new ObjectId(),
    name: "Administrator",
    email: "admin@mamun.com",
    phone: "+8801700000005",
    role: "admin",
    status: "active",
    password_hash: "$2b$10$demo_password_hash_placeholder",
    avatar_url: "https://via.placeholder.com/150",
    restaurant_id: null,
    created_at: daysAgo(400),
    updated_at: daysAgo(30),
  };

  await login.insertMany([mamun, customer2, owner1, owner2, admin]);

  // ---------- resturent-collection ----------
  const mkn = {
    _id: new ObjectId(),
    name: "MAMUN Kitchen",
    logo_url: "https://via.placeholder.com/120",
    cover_url: "https://via.placeholder.com/600x300",
    owner_login_id: owner1._id,
    cuisine: "Mixed",
    address: "123 Food Street, Dhaka",
    phone: "+8801711111111",
    is_open: true,
    rating: 4.9,
    delivery_charge: 3.99,
    min_order: 5,
    created_at: daysAgo(300),
  };

  const spicen = {
    _id: new ObjectId(),
    name: "Spice Garden",
    logo_url: "https://via.placeholder.com/120",
    cover_url: "https://via.placeholder.com/600x300",
    owner_login_id: owner2._id,
    cuisine: "Bengali",
    address: "45 Curry Lane, Dhaka",
    phone: "+8801722222222",
    is_open: true,
    rating: 4.6,
    delivery_charge: 2.5,
    min_order: 4,
    created_at: daysAgo(280),
  };

  const pizzahut = {
    _id: new ObjectId(),
    name: "Pizza Heaven",
    logo_url: "https://via.placeholder.com/120",
    cover_url: "https://via.placeholder.com/600x300",
    owner_login_id: owner1._id,
    cuisine: "Italian",
    address: "78 Basil Avenue, Dhaka",
    phone: "+8801733333333",
    is_open: false,
    rating: 4.4,
    delivery_charge: 4.5,
    min_order: 6,
    created_at: daysAgo(120),
  };

  await restaurants.insertMany([mkn, spicen, pizzahut]);

  // Link owners to their primary restaurant.
  await login.updateOne(
    { _id: owner1._id },
    { $set: { restaurant_id: mkn._id } }
  );
  await login.updateOne(
    { _id: owner2._id },
    { $set: { restaurant_id: spicen._id } }
  );

  // ---------- food-collection ----------
  const foodDefs = [
    // MAMUN Kitchen — Mix cuisine
    { restaurant_id: mkn._id, food_name: "Burger Royale", category: "Burger", price: 5.99, rating: 4.8, description: "Double beef patty with cheddar." },
    { restaurant_id: mkn._id, food_name: "Chicken Biryani", category: "Rice", price: 6.49, rating: 4.9, description: "Fragrant basmati with spiced chicken." },
    { restaurant_id: mkn._id, food_name: "Cheese Fries", category: "Sides", price: 3.49, rating: 4.5, description: "Crispy fries with melted cheese." },
    // Spice Garden — Bengali
    { restaurant_id: spicen._id, food_name: "Kacchi Biryani", category: "Rice", price: 7.99, rating: 4.8, description: "Mutton kacchi with borhani." },
    { restaurant_id: spicen._id, food_name: "Beef Tehari", category: "Rice", price: 6.99, rating: 4.6, description: "Washed rice layered with beef." },
    { restaurant_id: spicen._id, food_name: "Fuchka Plate", category: "Snacks", price: 2.99, rating: 4.4, description: "Tangy tamarind fuchka." },
    // Pizza Heaven — Italian
    { restaurant_id: pizzahut._id, food_name: "Margherita Pizza", category: "Pizza", price: 8.99, rating: 4.7, description: "Classic cheese with fresh basil." },
    { restaurant_id: pizzahut._id, food_name: "Pepperoni Pizza", category: "Pizza", price: 10.99, rating: 4.8, description: "Loaded with pepperoni." },
    { restaurant_id: pizzahut._id, food_name: "Garlic Bread", category: "Sides", price: 3.99, rating: 4.6, description: "Butter-garlic toasted bread." },
  ];

  const foodIndex = {};
  const foodDocs = foodDefs.map((f) => {
    const doc = {
      _id: new ObjectId(),
      restaurant_id: f.restaurant_id,
      food_name: f.food_name,
      category: f.category,
      description: f.description,
      price: f.price,
      image_url: "https://via.placeholder.com/200",
      is_available: true,
      rating: f.rating,
      created_at: daysAgo(100),
    };
    foodIndex[`${f.restaurant_id.toHexString()}:${f.food_name}`] = doc;
    return doc;
  });

  // ---------- order-summary + payment-intg ----------
  // Build orders for the two customers across a spread of dates/statuses.
  // Each order gets a matching payment-intg record.

  const mk = (restaurant, foodNames, quantities, created, status) => {
    const items = foodNames.map((name, i) => {
      const food = foodIndex[`${restaurant._id.toHexString()}:${name}`];
      return {
        food_id: food._id,
        food_name: food.food_name,
        quantity: quantities[i],
        unit_price: food.price,
      };
    });
    const subtotal = items.reduce(
      (s, it) => s + it.unit_price * it.quantity,
      0
    );
    const delivery_fee = restaurant.delivery_charge;
    const total_amount = Math.round((subtotal + delivery_fee) * 100) / 100;

    const orderId = new ObjectId();
    return {
      orderId,
      doc: {
        _id: orderId,
        user_id: mamun._id,
        restaurant_id: restaurant._id,
        restaurant_name: restaurant.name,
        restaurant_logo: restaurant.logo_url,
        items,
        subtotal: Math.round(subtotal * 100) / 100,
        delivery_fee,
        total_amount,
        status,
        created_at: created,
        updated_at: created,
      },
    };
  };

  const orderDefs = [
    // today (day range)
    mk(mkn, ["Burger Royale", "Cheese Fries"], [1, 1], hoursAgo(2), "Delivered"),
    mk(spicen, ["Kacchi Biryani"], [1], hoursAgo(5), "Preparing"),
    // this week / month
    mk(mkn, ["Chicken Biryani"], [2], daysAgo(1), "Delivered"),
    mk(pizzahut, ["Margherita Pizza", "Garlic Bread"], [1, 1], daysAgo(3), "Delivered"),
    mk(spicen, ["Beef Tehari", "Fuchka Plate"], [1, 2], daysAgo(5), "Cancelled"),
    mk(mkn, ["Burger Royale"], [3], daysAgo(9), "Delivered"),
    // earlier this month
    mk(pizzahut, ["Pepperoni Pizza"], [2], daysAgo(14), "Delivered"),
    mk(mkn, ["Cheese Fries"], [4], daysAgo(18), "Cancelled"),
    // previous months (year range keeps meaningful totals)
    mk(spicen, ["Kacchi Biryani", "Fuchka Plate"], [1, 1], daysAgo(40), "Delivered"),
    mk(mkn, ["Chicken Biryani", "Burger Royale"], [1, 1], daysAgo(75), "Delivered"),
    mk(pizzahut, ["Margherita Pizza"], [2], daysAgo(120), "Delivered"),
    mk(spicen, ["Beef Tehari"], [2], daysAgo(200), "Cancelled"),
    mk(mkn, ["Burger Royale", "Cheese Fries", "Chicken Biryani"], [1, 1, 1], daysAgo(260), "Delivered"),
  ];

  const orderDocs = orderDefs.map((o) => o.doc);
  const paymentDocs = orderDefs.map((o, i) => ({
    _id: new ObjectId(),
    order_id: o.orderId,
    user_id: mamun._id,
    method: i % 2 === 0 ? "bKash" : "Cash on Delivery",
    amount: o.doc.total_amount,
    currency: "BDT",
    status: o.doc.status === "Cancelled" ? "refunded" : "completed",
    transaction_id: `TXN-${100000 + i}`,
    gateway_response: { provider: "bkash", ref: `BK-${100000 + i}` },
    created_at: o.doc.created_at,
  }));

  // Customer 2 — a couple of orders so collections aren't empty.
  const c2a = mk(mkn, ["Burger Royale"], [1], daysAgo(2), "Delivered");
  const c2aDoc = c2a.doc;
  c2aDoc.user_id = customer2._id;
  await orders.insertOne(c2aDoc);
  await payments.insertOne({
    _id: new ObjectId(),
    order_id: c2a.orderId,
    user_id: customer2._id,
    method: "Nagad",
    amount: c2aDoc.total_amount,
    currency: "BDT",
    status: "completed",
    transaction_id: `TXN-${900001}`,
    gateway_response: {},
    created_at: c2aDoc.created_at,
  });

  await foods.insertMany(foodDocs);
  await orders.insertMany(orderDocs);
  await payments.insertMany(paymentDocs);

  // ---------- coupons (idempotent, keeps existing admin-created ones) ----------
  const coupons = db.collection("coupons");
  const existing = await coupons.countDocuments({});
  if (existing === 0) {
    const couponDefs = [
      { code: "WELCOME30", type: "Percentage", value: 30, description: "30% off your first order." },
      { code: "FREEDEL", type: "Free Delivery", value: 0, description: "Free delivery on your order." },
      { code: "WEEKEND50", type: "Percentage", value: 50, description: "Weekend special: 50% off." },
      { code: "PASTA15", type: "Percentage", value: 15, description: "15% off pasta & Italian dishes." },
    ];
    await coupons.insertMany(
      couponDefs.map((c) => ({
        ...c,
        usage: 0,
        max_usage: 0,
        expires: new Date("2026-12-31"),
        active: true,
        created_at: now,
      }))
    );
  }

  console.log(`✓ login:                  ${await login.countDocuments({})}`);
  console.log(`✓ resturent-collection:   ${await restaurants.countDocuments({})}`);
  console.log(`✓ food-collection:        ${await foods.countDocuments({})}`);
  console.log(`✓ order-summary:          ${await orders.countDocuments({})}`);
  console.log(`✓ payment-intg:           ${await payments.countDocuments({})}`);
  console.log(`✓ coupons:                ${await coupons.countDocuments({})}`);

  console.log("\nDemo customer X-User-Id for the analytics API:");
  console.log(mamun._id.toHexString());

  await client.close();
  console.log("Seed complete.");
}

// Keep mongoose import optional so seed also runs in a pure-native project.
seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
