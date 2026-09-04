import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo.js";
import { createAdminNotification } from "../services/notification.service.js";

// ============================================================
// Food management (MongoDB-backed).
//
//   Public router (foodRouter)     : GET /   -> list foods (?restaurant_id=)
//   Owner router (ownerFoodRouter) : GET/POST/PUT/DELETE for the logged-in
//                                    restaurant owner's OWN foods.
//
// The owner router is mounted under verifyRole("restaurantOwner"); the owner's
// restaurant is identified by req.userData.restaurant_id. Restaurant name/logo
// are stored on each food doc so orders + invoices can show the restaurant
// without a join.
// ============================================================

export const foodRouter = Router();
export const ownerFoodRouter = Router();

const FOOD = "food-collection";
const RESTAURANT = "resturent-collection";
const REVIEWS = "reviews";

function cleanFoodInput(body) {
  const name = String(body.name || "").trim();
  const category = String(body.category || "Other").trim();
  const price = Math.max(0, Number(body.price) || 0);
  const stock = Math.max(0, Math.floor(Number(body.stock) || 0));
  const rating = Math.min(5, Math.max(0, Number(body.rating) || 4.5));
  const image =
    String(body.image || "").trim() || String(body.image_url || "").trim();
  const description = String(body.description || "").trim();
  const discount = Math.max(0, Number(body.discount) || 0);
  const ingredients = Array.isArray(body.ingredients)
    ? body.ingredients.map((s) => String(s).trim()).filter(Boolean)
    : typeof body.ingredients === "string"
      ? body.ingredients.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const isAvailable = body.isAvailable != null ? !!body.isAvailable : body.is_available != null ? !!body.is_available : true;
  return { name, category, price, stock, rating, image, description, discount, ingredients, isAvailable };
}

function bodyIsAvailable(body) {
  if (body.isAvailable != null) return !!body.isAvailable;
  if (body.is_available != null) return !!body.is_available;
  return true;
}

async function getOwnerRestaurant(restaurantId) {
  const db = getDb();
  const restaurants = db.collection(RESTAURANT);
  try {
    if (restaurantId) {
      return await restaurants.findOne({ _id: new ObjectId(restaurantId) });
    }
  } catch {
    return null;
  }
  return null;
}

function toPublic(d) {
  return {
    id: d._id.toString(),
    food_id: d._id.toString(),
    restaurant_id: d.restaurant_id ? d.restaurant_id.toString() : null,
    restaurant_name: d.restaurant_name || "",
    restaurant_logo: d.restaurant_logo || "",
    name: d.food_name || d.name || "",
    food_name: d.food_name || d.name || "",
    category: d.category || "Other",
    price: d.price || 0,
    rating: d.rating != null ? d.rating : null,
    image: d.image_url || d.image || "",
    stock: d.stock || 0,
    description: d.description || "",
    discount: d.discount || 0,
    ingredients: d.ingredients || [],
    is_available: d.is_available != null ? d.is_available : true,
    created_at: d.created_at ? d.created_at.toISOString() : null,
  };
}

// ============================================================
// PUBLIC  GET /api/food  (?restaurant_id= to filter one restaurant)
// ============================================================
foodRouter.get("/", async (req, res, next) => {
  try {
    const { restaurant_id, restaurantId } = req.query;
    const rid = restaurant_id || restaurantId;
    const db = getDb();
    const foods = db.collection(FOOD);
    let filter = {};
    if (rid) {
      try {
        filter = { restaurant_id: new ObjectId(String(rid)) };
      } catch {
        return res.status(400).json({ error: "Invalid restaurant id" });
      }
    }
    const docs = await foods.find(filter).sort({ created_at: -1 }).toArray();

    // Real review counts from the reviews collection (counted per dish name).
    let reviewCounts = {};
    try {
      const counts = await db
        .collection(REVIEWS)
        .aggregate([{ $group: { _id: "$dish", count: { $sum: 1 } } }])
        .toArray();
      counts.forEach((c) => {
        reviewCounts[c._id] = c.count;
      });
    } catch {
      reviewCounts = {};
    }

    res.json({
      success: true,
      foods: docs.map((d) => {
        const dish = d.food_name || d.name || "";
        return {
          ...toPublic(d),
          review_count: reviewCounts[dish] || 0,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PUBLIC  GET /api/food/popular
// Returns the most ordered foods across all orders (top 8).
// Aggregates from order-summary collection to count food orders.
// ============================================================
foodRouter.get("/popular", async (req, res, next) => {
  try {
    const db = getDb();
    const orders = db.collection("order-summary");
    const foods = db.collection(FOOD);

    const popular = await orders
      .aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.food_id",
            total_ordered: { $sum: "$items.quantity" },
          },
        },
        { $sort: { total_ordered: -1 } },
        { $limit: 8 },
      ])
      .toArray();

    if (popular.length === 0) {
      const allFoods = await foods.find({}).limit(8).sort({ created_at: -1 }).toArray();
      return res.json({ success: true, foods: allFoods.map(toPublic) });
    }

    const foodIds = popular
      .map((p) => {
        try { return new ObjectId(p._id); } catch { return null; }
      })
      .filter(Boolean);

    const foodDocs = await foods.find({ _id: { $in: foodIds } }).toArray();
    const foodMap = {};
    foodDocs.forEach((f) => { foodMap[f._id.toString()] = toPublic(f); });

    const result = popular
      .map((p) => ({ ...foodMap[p._id], total_ordered: p.total_ordered }))
      .filter((f) => f && f.id);

    if (result.length === 0) {
      const allFoods = await foods.find({}).limit(8).sort({ created_at: -1 }).toArray();
      return res.json({ success: true, foods: allFoods.map(toPublic) });
    }

    res.json({ success: true, foods: result });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PUBLIC  GET /api/food/categories
// Returns the list of food categories actually present in the DB,
// with the number of items in each. Used by the Food Categories page,
// the Menu category filter and the Home category links.
// ============================================================
foodRouter.get("/categories", async (req, res, next) => {
  try {
    const db = getDb();
    const foods = db.collection(FOOD);
    const docs = await foods
      .aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();
    const categories = docs
      .filter((d) => d._id)
      .map((d) => ({ name: String(d._id), count: d.count }));
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// OWNER  GET /api/owner/food
// ============================================================
ownerFoodRouter.get("/", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res
        .status(400)
        .json({ error: "No restaurant is linked to this account." });
    }
    const db = getDb();
    const docs = await db
      .collection(FOOD)
      .find({ restaurant_id: new ObjectId(restaurantId) })
      .sort({ created_at: -1 })
      .toArray();
    res.json({ success: true, foods: docs.map(toPublic) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// OWNER  POST /api/owner/food
// ============================================================
ownerFoodRouter.post("/", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res
        .status(400)
        .json({ error: "No restaurant is linked to this account." });
    }
    const restaurant = await getOwnerRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found." });
    }
    const input = cleanFoodInput(req.body || {});
    if (!input.name) {
      return res.status(400).json({ error: "Food name is required." });
    }
    if (input.price <= 0) {
      return res.status(400).json({ error: "Price must be greater than 0." });
    }
    const now = new Date();
    const doc = {
      restaurant_id: new ObjectId(restaurantId),
      restaurant_name: restaurant.name || "",
      restaurant_logo: restaurant.logo_url || restaurant.logo || "",
      food_name: input.name,
      name: input.name,
      category: input.category,
      description: input.description,
      discount: input.discount,
      ingredients: input.ingredients,
      price: Math.round(input.price * 100) / 100,
      image_url: input.image,
      image: input.image,
      stock: input.stock,
      rating: input.rating,
      is_available: input.isAvailable,
      created_at: now,
      updated_at: now,
    };
    const db = getDb();
    const result = await db.collection(FOOD).insertOne(doc);
    const created = { ...doc, _id: result.insertedId };

    // Role-based admin notification: a food item was submitted by the owner.
    try {
      await createAdminNotification({
        type: "food",
        title: "New food item added",
        message: `${input.name} was added to ${restaurant.name || "a restaurant"}.`,
        role: "restaurantOwner",
        userId: req.userData.id,
        userName: req.userData.name || restaurant.name || "",
        relatedId: result.insertedId.toString(),
        relatedType: "food",
        navigateTo: "/admin/foods",
        dedupeKey: `food_submitted_${result.insertedId}`,
      });
    } catch (e) {
      console.warn("Failed to create admin notification:", e.message);
    }

    res.status(201).json({ success: true, food: toPublic(created) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// OWNER  PUT /api/owner/food/:id
// ============================================================
ownerFoodRouter.put("/:id", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res
        .status(400)
        .json({ error: "No restaurant linked to this account." });
    }
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: "Invalid food id" });
    }
    const db = getDb();
    const foods = db.collection(FOOD);
    const existing = await foods.findOne({
      _id: id,
      restaurant_id: new ObjectId(restaurantId),
    });
    if (!existing) {
      return res.status(404).json({ error: "Food not found." });
    }
    const input = cleanFoodInput(req.body || {});
    const patch = {
      food_name: input.name || existing.food_name,
      name: input.name || existing.name,
      category: input.category || existing.category,
      description: input.description,
      discount: input.discount,
      ingredients: input.ingredients,
      price:
        input.price > 0 ? Math.round(input.price * 100) / 100 : existing.price,
      image_url: input.image || existing.image_url,
      image: input.image || existing.image,
      stock: input.stock,
      rating: input.rating,
      is_available: input.isAvailable,
      updated_at: new Date(),
    };
    await foods.updateOne({ _id: id }, { $set: patch });
    res.json({ success: true, food: { id: id.toString(), ...patch } });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// OWNER  DELETE /api/owner/food/:id
// ============================================================
ownerFoodRouter.delete("/:id", async (req, res, next) => {
  try {
    const restaurantId = req.userData.restaurant_id;
    if (!restaurantId) {
      return res
        .status(400)
        .json({ error: "No restaurant linked to this account." });
    }
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: "Invalid food id" });
    }
    const db = getDb();
    const result = await db.collection(FOOD).deleteOne({
      _id: id,
      restaurant_id: new ObjectId(restaurantId),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Food not found." });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PUBLIC  GET /api/food/:id
// Returns a single food by id with its real review count.
// ============================================================
foodRouter.get("/:id", async (req, res, next) => {
  try {
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: "Invalid food id" });
    }
    const db = getDb();
    const doc = await db.collection(FOOD).findOne({ _id: id });
    if (!doc) {
      return res.status(404).json({ error: "Food not found." });
    }
    const dish = doc.food_name || doc.name || "";
    const review_count = dish
      ? await db.collection(REVIEWS).countDocuments({ dish })
      : 0;
    res.json({
      success: true,
      food: { ...toPublic(doc), review_count: review_count || 0 },
    });
  } catch (err) {
    next(err);
  }
});
