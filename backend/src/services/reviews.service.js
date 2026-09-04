// ============================================================
// Review photo enrichment.
//
// The "reviews" collection stores text/rating only — no photos.
// Real avatars and dish photos are resolved from MongoDB at read
// time so every review card can show a real image:
//   avatar_url  -> the reviewer's avatar from the login collection
//   food_image  -> the dish photo from the food-collection (matched
//                  by the review's dish name, case-insensitive)
// ============================================================

import { ObjectId } from "mongodb";

export async function enrichReviews(db, reviewDocs) {
  const list = Array.isArray(reviewDocs) ? reviewDocs : [];
  if (list.length === 0) return [];

  const userIds = [];
  const dishNames = new Set();
  for (const r of list) {
    if (r.user_id && ObjectId.isValid(r.user_id)) userIds.push(r.user_id);
    const dish = String(r.dish || r.food_name || "").trim();
    if (dish) dishNames.add(dish);
  }

  const [users, foods] = await Promise.all([
    userIds.length
      ? db
          .collection("login")
          .find({ _id: { $in: userIds } })
          .project({ avatar_url: 1 })
          .toArray()
      : Promise.resolve([]),
    dishNames.size
      ? db
          .collection("food-collection")
          .find({
            $or: [...dishNames].map((d) => ({ food_name: d })),
          })
          .project({ food_name: 1, image_url: 1, image: 1 })
          .toArray()
      : Promise.resolve([]),
  ]);

  const avatarByUser = new Map(
    users.map((u) => [u._id.toString(), u.avatar_url || ""])
  );
  const imageByDish = new Map();
  for (const f of foods) {
    const key = String(f.food_name || "").trim();
    if (key && !imageByDish.has(key)) {
      imageByDish.set(key, f.image_url || f.image || "");
    }
  }
  const findImage = (dish) => {
    const key = String(dish || "").trim();
    if (!key) return "";
    if (imageByDish.has(key)) return imageByDish.get(key);
    const lower = key.toLowerCase();
    for (const [name, img] of imageByDish) {
      if (name.toLowerCase() === lower) return img;
    }
    return "";
  };

  return list.map((r) => ({
    ...r,
    avatar_url:
      r.avatar_url ||
      avatarByUser.get(r.user_id ? String(r.user_id) : "") ||
      "",
    food_image: r.food_image || r.image || findImage(r.dish || r.food_name || ""),
  }));
}