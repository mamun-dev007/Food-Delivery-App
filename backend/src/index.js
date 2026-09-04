import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectToDatabase } from "./db/mongo.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { customerRouter } from "./routes/customer.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { foodRouter, ownerFoodRouter } from "./routes/food.routes.js";
import {
  ownerRouter,
  publicRestaurantRouter,
} from "./routes/restaurant.routes.js";
import { riderRouter } from "./routes/rider.routes.js";
import {
  publicCouponRouter,
  adminCouponRouter,
} from "./routes/coupons.routes.js";
import {
  publicReviewRouter,
  customerReviewRouter,
} from "./routes/reviews.routes.js";
import { initFirebaseAdmin } from "./config/firebaseAdmin.js";
import { verifyRole } from "./middleware/auth.middleware.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Allow local dev ports, the deployed domain, and any Vercel preview origin.
// Browsers send an Origin header even on same-origin POSTs, so an overly strict
// whitelist turns valid requests into 500 "CORS blocked" errors.
const EXPLICIT_ORIGINS = (
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5173,http://localhost:5174,http://localhost:5175,https://food-delevery-lake.vercel.app"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (EXPLICIT_ORIGINS.includes(origin)) return true;
  return /^https:\/\/[\w-]+\.vercel\.app$/i.test(origin);
}

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  }),
);
app.use(express.json());

// ---- Health check ----
app.get("/api/health", async (req, res) => {
  try {
    const db = await connectToDatabase();
    await db.command({ ping: 1 });
    res.json({ status: "ok", db: db.databaseName });
  } catch (err) {
    res.status(503).json({ status: "db_unavailable", error: err.message });
  }
});

// ---- Routers ----
app.use("/api/auth", authRouter);
// Admin panel routes (list/approve/reject restaurant-owner verification).
// The admin router enforces verifyRole("admin") on every route.
app.use("/api/admin", adminRouter);
// Orders analytics is customer-only. Authority is the REAL MongoDB role
// (verified via the Firebase ID token in verifyRole).
app.use("/api/user", verifyRole("customer"), ordersRouter);
// Customer dashboard data (notifications + read-state; real data from the DB).
app.use("/api/customer", verifyRole("customer"), customerRouter);
// Public food listing (all restaurants, or one via ?restaurant_id=).
app.use("/api/food", foodRouter);
// Public restaurant listing (all approved restaurants for the Restaurants page).
app.use("/api/restaurants", publicRestaurantRouter);
// Restaurant-owner food management (own restaurant only).
app.use("/api/owner/food", verifyRole("restaurantOwner"), ownerFoodRouter);
// Restaurant-owner orders (real data from the DB for the dashboard).
app.use("/api/owner", verifyRole("restaurantOwner"), ownerRouter);
// Rider orders, deliveries, history and earnings (real data from the DB).
app.use("/api/rider", verifyRole("rider"), riderRouter);
// Public coupons (listing + validation) and admin coupon management.
app.use("/api/coupons", publicCouponRouter);
app.use("/api/admin/coupons", adminCouponRouter);
// Reviews: public listing, plus customer-only creation.
app.use("/api/reviews", publicReviewRouter);
app.use("/api/reviews", customerReviewRouter);

// ---- 404 + error handlers ----
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

async function start() {
  try {
    // Connect MongoDB up-front so every request path has a ready handle.
    await connectToDatabase();
    // Fail fast if Firebase Admin (needed for token verification) is missing.
    await initFirebaseAdmin();
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
