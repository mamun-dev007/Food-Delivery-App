import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo.js";
import { verifyRole } from "../middleware/auth.middleware.js";
import { createAdminNotification } from "../services/notification.service.js";
import { enrichReviews } from "../services/reviews.service.js";

// ============================================================
// Reviews & Ratings.
//
//   Public  GET  /api/reviews        -> all reviews (newest first)
//   Customer POST /api/reviews       -> create a review (logged-in customer)
//
// Reviews are stored in the "reviews" collection with:
//   user_id, user_name, user_email, dish, rating (1-5), text,
//   created_at. They persist in MongoDB so they survive refresh/logout.
// ============================================================

export const publicReviewRouter = Router();
export const customerReviewRouter = Router();
customerReviewRouter.use(verifyRole("customer"));

const REVIEWS = "reviews";

function toPublic(d) {
  return {
    id: d._id.toString(),
    user_id: d.user_id ? d.user_id.toString() : null,
    restaurant_id: d.restaurant_id ? d.restaurant_id.toString() : null,
    name: d.user_name || "Customer",
    avatar_url: d.avatar_url || "",
    dish: d.dish || "",
    food_image: d.food_image || "",
    rating: Number(d.rating || 0),
    text: d.text || "",
    created_at: d.created_at ? new Date(d.created_at).toISOString() : null,
  };
}

// ============================================================
// PUBLIC  GET /api/reviews  (?dish= to filter one dish's reviews)
// Returns reviews, newest first.
// ============================================================
publicReviewRouter.get("/", async (req, res, next) => {
  try {
    const { dish } = req.query;
    let filter = {};
    if (dish) {
      filter = { dish: String(dish) };
    }
    const db = getDb();
    // Enrich each review with the reviewer's avatar (login collection) and the
    // dish photo (food-collection) so every review card shows a real image.
    const docs = await db
      .collection(REVIEWS)
      .find(filter)
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();
    const enriched = await enrichReviews(db, docs);

    res.json({
      success: true,
      reviews: enriched.map((d) => ({
        ...toPublic(d),
        avatar_url: d.avatar_url || "",
        food_image: d.food_image || "",
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// CUSTOMER  POST /api/reviews
// Body: { dish, rating (1-5), text }
// Creates a review attributed to the logged-in customer.
// ============================================================
customerReviewRouter.post("/", async (req, res, next) => {
  try {
    const { dish, rating, text, restaurant_id } = req.body || {};
    const userData = req.userData;

    const cleanRating = Math.min(
      5,
      Math.max(1, Math.floor(Number(rating) || 0))
    );
    const cleanDish = String(dish || "").trim();
    const cleanText = String(text || "").trim();

    if (!cleanRating) {
      return res.status(400).json({ error: "Please select a star rating." });
    }
    if (!cleanText) {
      return res.status(400).json({ error: "Please write your review." });
    }
    if (!cleanDish) {
      return res.status(400).json({ error: "Please add the dish you tried." });
    }

    const now = new Date();
    let restaurantObjectId = null;
    if (restaurant_id) {
      try {
        restaurantObjectId = new ObjectId(String(restaurant_id));
      } catch {
        restaurantObjectId = null;
      }
    }

    const doc = {
      user_id: userData.id ? new ObjectId(userData.id) : null,
      user_name: userData.name || "Customer",
      user_email: userData.email || "",
      dish: cleanDish,
      rating: cleanRating,
      text: cleanText,
      restaurant_id: restaurantObjectId,
      created_at: now,
    };

    const db = getDb();
    const result = await db.collection(REVIEWS).insertOne(doc);

    // Role-based admin notification: customer submitted feedback/complaint.
    try {
      const isLow = cleanRating <= 2;
      await createAdminNotification({
        type: isLow ? "complaint" : "review",
        title: isLow ? "Customer complaint received" : "New customer feedback",
        message: `${userData.name || "A customer"} rated "${cleanDish}" ${cleanRating}/5${isLow ? " (negative — review needed)" : ""}.`,
        role: "customer",
        userId: userData.id,
        userName: userData.name || "",
        relatedId: result.insertedId.toString(),
        relatedType: "review",
        navigateTo: "/admin/reviews",
        dedupeKey: `review_submitted_${result.insertedId}`,
      });
    } catch (e) {
      console.warn("Failed to create admin notification:", e.message);
    }

    res.status(201).json({
      success: true,
      review: toPublic({ ...doc, _id: result.insertedId }),
    });
  } catch (err) {
    next(err);
  }
});
