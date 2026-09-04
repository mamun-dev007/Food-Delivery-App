// ============================================================
// Seed real coupon/offer codes into MongoDB (idempotent).
// Run once: `npm run seed:coupons`
// Only touches the "coupons" collection — safe to run anytime
// without wiping existing data. Matches the codes shown on the
// Offers page so checkout validation works out of the box.
// ============================================================
import { connectToDatabase, client } from "./mongo.js";

const couponDefs = [
  { code: "WELCOME30", type: "Percentage", value: 30, description: "30% off your first order." },
  { code: "FREEDEL", type: "Free Delivery", value: 0, description: "Free delivery on your order." },
  { code: "WEEKEND50", type: "Percentage", value: 50, description: "Weekend special: 50% off." },
  { code: "PASTA15", type: "Percentage", value: 15, description: "15% off pasta & Italian dishes." },
];

async function seedCoupons() {
  const db = await connectToDatabase();
  const coupons = db.collection("coupons");
  const now = new Date();

  for (const c of couponDefs) {
    const existing = await coupons.findOne({ code: c.code });
    if (existing) {
      console.log(`skip  ${c.code} (already exists)`);
      continue;
    }
    await coupons.insertOne({
      ...c,
      usage: 0,
      max_usage: 0,
      expires: new Date("2026-12-31"),
      active: true,
      created_at: now,
    });
    console.log(`seed  ${c.code}`);
  }

  console.log(`\ncoupons total: ${await coupons.countDocuments({})}`);
  await client.close();
  console.log("Coupon seed complete.");
}

seedCoupons().catch((err) => {
  console.error("Coupon seed failed:", err);
  process.exit(1);
});
