// Vercel serverless entrypoint.
//
// Re-exports the same Express API as backend/src/index.js but WITHOUT
// app.listen(): on Vercel the platform invokes the exported app per request.
// Mongo + Firebase Admin are initialised lazily on first request and then
// cached across warm invocations (see db/mongo.js / config/firebaseAdmin.js).

import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectToDatabase } from "../backend/src/db/mongo.js";
import { ordersRouter } from "../backend/src/routes/orders.routes.js";
import { customerRouter } from "../backend/src/routes/customer.routes.js";
import { authRouter } from "../backend/src/routes/auth.routes.js";
import { adminRouter } from "../backend/src/routes/admin.routes.js";
import { foodRouter, ownerFoodRouter } from "../backend/src/routes/food.routes.js";
import { ownerRouter, publicRestaurantRouter } from "../backend/src/routes/restaurant.routes.js";
import { riderRouter } from "../backend/src/routes/rider.routes.js";
import { publicCouponRouter, adminCouponRouter } from "../backend/src/routes/coupons.routes.js";
import { publicReviewRouter, customerReviewRouter } from "../backend/src/routes/reviews.routes.js";
import { initFirebaseAdmin } from "../backend/src/config/firebaseAdmin.js";
import { verifyRole } from "../backend/src/middleware/auth.middleware.js";

const app = express();

const EXPLICIT_ORIGINS = (
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5173,http://localhost:5174,http://localhost:5175,https://food-delevery-lake.vercel.app"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Browsers send an Origin header even on same-origin POSTs. Allow the
// deployment domain(s) (production + every new preview URL) so login/register
// never get blocked. Unknown origins simply get no CORS headers instead of a 500.
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

// Warm up Mongo + Firebase Admin before any route runs. Cached afterwards.
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    await initFirebaseAdmin();
    next();
  } catch (err) {
    next(err);
  }
});

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

// ---- Routers (identical to backend/src/index.js) ----
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", verifyRole("customer"), ordersRouter);
app.use("/api/customer", verifyRole("customer"), customerRouter);
app.use("/api/food", foodRouter);
app.use("/api/restaurants", publicRestaurantRouter);
app.use("/api/owner/food", verifyRole("restaurantOwner"), ownerFoodRouter);
app.use("/api/owner", verifyRole("restaurantOwner"), ownerRouter);
app.use("/api/rider", verifyRole("rider"), riderRouter);
app.use("/api/coupons", publicCouponRouter);
app.use("/api/admin/coupons", adminCouponRouter);
app.use("/api/reviews", publicReviewRouter);
app.use("/api/reviews", customerReviewRouter);

// ---- 404 + error handlers ----
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

export default app;