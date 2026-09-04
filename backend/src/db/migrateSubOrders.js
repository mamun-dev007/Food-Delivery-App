// ============================================================
// Backfill `sub_orders[]` on legacy single-restaurant orders.
// Idempotent: orders that already carry sub_orders are skipped.
//
// Run once: `node src/db/migrateSubOrders.js` (from backend/)
// ============================================================
import { ObjectId } from "mongodb";
import { connectToDatabase, client } from "./mongo.js";
import { COMMISSION_RATE, round2 } from "../services/revenue.service.js";

async function migrate() {
  const db = await connectToDatabase();
  const orders = db.collection("order-summary");

  const cursor = orders.find({ sub_orders: { $exists: false } });
  let matched = 0;
  let updated = 0;
  let skipped = 0;

  while (await cursor.hasNext()) {
    const o = await cursor.next();
    matched += 1;

    // Legacy orders store the single restaurant on the top level.
    if (o.restaurant_id == null) {
      skipped += 1;
      continue;
    }

    const items = Array.isArray(o.items) ? o.items : [];
    const subtotal = round2(Number(o.subtotal ?? 0));
    const deliveryFee = round2(Number(o.delivery_fee ?? 0));
    const discount = round2(Number(o.discount ?? 0));
    const total = round2(Number(o.total_amount ?? o.total ?? 0));
    const status = o.status || "Pending";
    const adminCommission = round2(subtotal * COMMISSION_RATE);
    const restaurantRevenue = round2(subtotal - adminCommission);
    const isDelivered = status === "Delivered";

    const sub = {
      subOrderId: new ObjectId().toString(),
      restaurant_id: String(o.restaurant_id),
      restaurant_name: o.restaurant_name || "",
      restaurant_logo: o.restaurant_logo || "",
      items,
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total: round2(total || subtotal + deliveryFee - discount),
      status,
      rider_status: o.rider_status || null,
      adminCommission,
      restaurantRevenue,
      revenueProcessed: isDelivered,
      completed_at: isDelivered ? (o.completed_at || o.updated_at || new Date()) : null,
    };

    await orders.updateOne({ _id: o._id }, { $set: { sub_orders: [sub] } });
    updated += 1;
  }

  console.log(`Scanned ${matched} legacy documents (no sub_orders).`);
  console.log(`Updated ${updated}; skipped ${skipped} (no restaurant_id).`);
  console.log("Index: sub_orders.restaurant_id");
  await orders.createIndex({ "sub_orders.restaurant_id": 1 });
  console.log("✓ sub_orders.restaurant_id index ensured");

  await client.close();
  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});