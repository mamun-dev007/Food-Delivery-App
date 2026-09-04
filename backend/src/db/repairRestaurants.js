// ============================================================
// Repair: ensure every restaurantOwner account has a restaurant
// in resturent-collection matching its restaurant_id.
// Insert a restaurant when the id is not present (uses the
// owner's restaurant_id as the new restaurant _id).
// ============================================================
import { ObjectId } from "mongodb";
import { connectToDatabase, client } from "./mongo.js";

const FALLBACKS = [
  {
    loginEmail: "rest@gmail.com",
    name: "Spice Garden",
    cuisine: "Bengali",
    address: "45 Curry Lane, Dhaka",
    phone: "+8801722222222",
  },
];

async function repair() {
  const db = await connectToDatabase();
  const login = db.collection("login");
  const restaurants = db.collection("resturent-collection");
  const now = new Date();

  const owners = await login
    .find({ role: "restaurantOwner", restaurant_id: { $ne: null } })
    .toArray();

  let fixed = 0;
  for (const o of owners) {
    const rid = o.restaurant_id;
    let oid;
    try {
      oid = new ObjectId(rid.toString());
    } catch {
      console.log(`skip ${o.email}: invalid restaurant_id ${rid}`);
      continue;
    }
    const exists = await restaurants.findOne({ _id: oid });
    if (exists) {
      console.log(`ok ${o.email} -> ${exists.name}`);
      continue;
    }
    const fb = FALLBACKS.find((f) => f.loginEmail === o.email);
    const doc = {
      _id: oid,
      name: fb ? fb.name : `${o.name || "Owner"}'s Restaurant`,
      logo_url: "https://via.placeholder.com/120",
      cover_url: "https://via.placeholder.com/600x300",
      owner_login_id: o._id,
      cuisine: fb ? fb.cuisine : "Mixed",
      address: fb ? fb.address : "",
      phone: fb ? fb.phone : "",
      is_open: true,
      open: true,
      rating: 0,
      delivery_charge: 3.99,
      min_order: 5,
      created_at: now,
      updated_at: now,
    };
    await restaurants.insertOne(doc);
    fixed++;
    console.log(`create ${o.email} -> ${doc.name}`);
  }

  // seed categories for any restaurant that now has none
  const categories = db.collection("categories");
  const allRests = await restaurants.find({}).toArray();
  const defaults = ["Pizza", "Burger", "Biryani", "Pasta", "Snacks", "Drinks", "Dessert"];
  for (const r of allRests) {
    const count = await categories.countDocuments({ restaurant_id: r._id });
    if (count === 0) {
      await categories.insertMany(defaults.map((name) => ({ restaurant_id: r._id, name, created_at: now })));
      console.log(`categories seeded for ${r.name}`);
    }
  }

  console.log(`\nrestaurants fixed: ${fixed}`);
  await client.close();
  console.log("Repair complete.");
}

repair().catch((err) => {
  console.error("Repair failed:", err);
  process.exit(1);
});
