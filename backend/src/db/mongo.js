import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
export const DB_NAME = process.env.DB_NAME || "Food-Delivery001";

// If no URI is configured, fall back to a clearly-marked placeholder so
// the module loads; real connections still require a real URI.
if (!uri) {
  console.warn(
    "[mongodb] MONGODB_URI is not set. Set it in backend/.env to connect.",
  );
}

export const client = new MongoClient(uri || "mongodb://localhost:27017", {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db = null;

/**
 * Connect to Atlas and send a ping to confirm the connection,
 * then cache and return the database handle.
 */
export async function connectToDatabase() {
  if (db) return db;

  await client.connect();
  // Ping to verify a successful connection (confirm your deployment is live).
  await client.db("admin").command({ ping: 1 });
  console.log("Connected to MongoDB!");

  db = client.db(DB_NAME);
  return db;
}

/** Access the active database handle (must call connectToDatabase first). */
export function getDb() {
  if (!db)
    throw new Error("Database not connected. Call connectToDatabase() first.");
  return db;
}
