// ============================================================
// Seed a few realistic reviews+ratings into MongoDB (idempotent).
// Run once: `npm run seed:reviews`
// Only touches the "reviews" collection. Safe to run anytime.
// ============================================================
import { ObjectId } from "mongodb";
import { connectToDatabase, client } from "./mongo.js";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * DAY);

const seedReviews = [
  {
    user_name: "Rafsan",
    user_email: "rafsan@example.com",
    dish: "Margherita Pizza",
    rating: 5,
    text: "The pizza was amazing, delivered hot and fast!",
    created_at: daysAgo(2),
  },
  {
    user_name: "Sadia",
    user_email: "sadia@example.com",
    dish: "Cheese Burger",
    rating: 4,
    text: "Good burger, could use more sauce but overall great.",
    created_at: daysAgo(5),
  },
  {
    user_name: "Tanvir",
    user_email: "tanvir@example.com",
    dish: "Chicken Biryani",
    rating: 5,
    text: "Rich, fragrant and full of flavor. Highly recommended!",
    created_at: daysAgo(8),
  },
  {
    user_name: "Nusrat",
    user_email: "nusrat@example.com",
    dish: "Kacchi Biryani",
    rating: 4,
    text: "Great taste, portion was decent. Will order again.",
    created_at: daysAgo(12),
  },
];

async function seedReviewsFn() {
  const db = await connectToDatabase();
  const reviews = db.collection("reviews");

  const existing = await reviews.countDocuments({});
  if (existing > 0) {
    console.log(`reviews already have ${existing} entries — skipping seed.`);
    await client.close();
    return;
  }

  await reviews.insertMany(
    seedReviews.map((r) => ({
      user_id: null,
      user_name: r.user_name,
      user_email: r.user_email,
      dish: r.dish,
      rating: r.rating,
      text: r.text,
      created_at: r.created_at,
    }))
  );

  console.log(`✓ reviews: ${await reviews.countDocuments({})} seeded.`);
  await client.close();
  console.log("Review seed complete.");
}

seedReviewsFn().catch((err) => {
  console.error("Review seed failed:", err);
  process.exit(1);
});
