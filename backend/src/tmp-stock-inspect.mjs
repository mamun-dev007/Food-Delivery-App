import { MongoClient } from "mongodb";
import "dotenv/config";
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.DB_NAME || "Food-Delevery001");
for (const cname of ["food-collection", "foods"]) {
  const coll = db.collection(cname);
  const n = await coll.countDocuments({});
  console.log("collection", cname, "count:", n);
  const sample = await coll.find({}).limit(3).toArray();
  for (const s of sample) console.log("  _id:", s._id.toString(), "| name:", s.food_name || s.name, "| stock:", s.stock, "| price:", s.price || s.discounted_price, "| is_available:", s.is_available);
}
await client.close();
