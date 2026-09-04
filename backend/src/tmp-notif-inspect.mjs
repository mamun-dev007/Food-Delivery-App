import { MongoClient } from "mongodb";
import "dotenv/config";
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.DB_NAME || "Food-Delevery001");
const rid = "6a99dfad501b1c3d3314ac40"; // Spice Garden
const orders = await db.collection("order-summary").find({}).toArray();
const foods = await db.collection("foods").find({}).toArray();
console.log("=== ORDERS ===");
for (const o of orders) console.log(o.order_no, "| rest:", o.restaurant_id, "| status:", o.status, "| created:", o.created_at, "| cus:", (o.delivery && o.delivery.name) || (o.customer && o.customer.name));
console.log("=== FOODS for Spice Garden ===");
for (const f of foods.filter(x => String(x.restaurant_id) === rid)) console.log(f.food_name || f.name, "| stock:", f.stock, "| updated:", f.updated_at);
console.log("=== ALL FOOD rest ids ===");
const seen = {};
for (const f of foods) { const k = String(f.restaurant_id); seen[k] = (seen[k]||0)+1; }
console.log(seen);
console.log("=== REVIEWS ===");
const reviews = await db.collection("reviews").find({}).toArray();
for (const r of reviews.slice(0,10)) console.log(r._id.toString(), "| user:", r.user_name || r.name, "| dish:", r.food_name || r.dish, "| rating:", r.rating, "| rest:", r.restaurant_id, "| created:", r.created_at || r.created);
await client.close();
