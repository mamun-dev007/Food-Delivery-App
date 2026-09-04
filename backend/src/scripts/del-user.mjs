import "dotenv/config";
import { getAdmin } from "../config/firebaseAdmin.js";
import { getAuth } from "firebase-admin/auth";

const app = await getAdmin();
const uid = process.argv[2];
if (!uid) {
  console.log("usage: node scripts/del-user.mjs <uid>");
  process.exit(0);
}
try {
  await getAuth(app).deleteUser(uid);
  console.log("DELETED", uid);
} catch (e) {
  console.log("ERR", e.message);
}
