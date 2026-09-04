import "dotenv/config";
import { connectToDatabase } from "../db/mongo.js";

const email = (process.argv[2] || "").toLowerCase().trim();
const uid = process.argv[3] || "";
if (!email) {
  console.log("usage: node scripts/promote-admin.mjs <email> [uid]");
  process.exit(0);
}

const db = await connectToDatabase();
const login = db.collection("login");
const existing = await login.findOne({ email });
const doc = {
  uid,
  name: "Administrator",
  email,
  role: "admin",
  status: "active",
  phone: existing?.phone || "",
  address: existing?.address || {},
  avatar_url: existing?.avatar_url || "",
  restaurant_id: existing?.restaurant_id || null,
  created_at: existing?.created_at || new Date(),
  updated_at: new Date(),
};
if (existing) {
  await login.updateOne({ email }, { $set: { role: "admin", status: "active", updated_at: new Date() } });
  console.log("updated existing admin:", email);
} else {
  await login.insertOne(doc);
  console.log("created admin:", email);
}
process.exit(0);
