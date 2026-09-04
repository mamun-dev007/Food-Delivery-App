// ============================================================
// Seed restaurant categories (idempotent).
// Run once: `npm run seed:categories`
// Adds a few default categories to any restaurant that has none.
// Only touches the "categories" collection.
// ============================================================
import { ObjectId } from "mongodb";
import { connectToDatabase, client } from "./mongo.js";

const DEFAULT_CATEGORIES = ["Pizza", "Burger", "Biryani", "Pasta", "Snacks", "Drinks", "Dessert"];

async function seedCategories() {
  const db = await connectToDatabase();
  const restaurants = await db.collection("resturent-collection").find({}).toArray();
  const categories = db.collection("categories");
  const now = new Date();

  for (const r of restaurants) {
    const existing = await categories.countDocuments({ restaurant_id: r._id });
    if (existing > 0) {
      console.log(`skip ${r.name} (${existing} categories)`);
      continue;
    }
    await categories.insertMany(
      DEFAULT_CATEGORIES.map((name) => ({
        restaurant_id: r._id,
        name,
        created_at: now,
      }))
    );
    console.log(`seed ${r.name} (${DEFAULT_CATEGORIES.length} categories)`);
  }

  console.log(`\ncategories total: ${await categories.countDocuments({})}`);
  await client.close();
  console.log("Category seed complete.");
}

seedCategories().catch((err) => {
  console.error("Category seed failed:", err);
  process.exit(1);
});
