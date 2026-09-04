import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchFoodCategories } from "../../services/foodService";
import { CardGridSkeleton } from "../../components/dashboard/Skeleton";

const categoryEmoji = {
  Pizza: "🍕",
  Burger: "🍔",
  Salad: "🥗",
  Pasta: "🍝",
  Dessert: "🍰",
  Snacks: "🍟",
  Sushi: "🍣",
  Drinks: "🥤",
  Main: "🍖",
  Rice: "🍚",
  Chicken: "🍗",
  Seafood: "🦐",
  Soup: "🍜",
  BBQ: "🍖",
  Biryani: "🍛",
  Curry: "🍛",
  Shawarma: "🌯",
  Wrap: "🌯",
  Sandwich: "🥪",
  Roll: "🌯",
  Noodles: "🍜",
  Steak: "🥩",
  Asian: "🍲",
  Indian: "🍛",
  Mexican: "🌮",
  "Fast Food": "🍔",
};

const FoodCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchFoodCategories()
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch(() => {
        if (active) setCategories([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="my-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Food Categories</h1>
        <p className="text-base-content/60 mt-2">
          Browse dishes by category and find exactly what you're craving.
        </p>
      </div>

      {loading ? (
        <CardGridSkeleton count={6} imageHeight="h-32" />
      ) : categories.length === 0 ? (
        <p className="text-center text-base-content/50 py-16">
          No categories available yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/menu?category=${encodeURIComponent(cat.name)}`}
              className="card bg-base-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="card-body items-center text-center">
                <span className="text-5xl">
                  {categoryEmoji[cat.name] || "🍽️"}
                </span>
                <h2 className="card-title">{cat.name}</h2>
                <p className="text-sm text-base-content/60">
                  {cat.count} {cat.count === 1 ? "item" : "items"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodCategories;
