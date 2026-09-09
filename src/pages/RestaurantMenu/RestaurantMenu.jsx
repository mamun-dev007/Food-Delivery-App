import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import FoodCard from "../../components/Card/Card";
import { fetchFoods } from "../../services/foodService";
import { fetchRestaurant } from "../../services/restaurantPublicService";
import { SkeletonCard, CardGridSkeleton, ListSkeleton } from "../../components/dashboard/Skeleton";

function toCardShape(db) {
  return {
    id: db.id || db.food_id,
    name: db.name || db.food_name,
    category: db.category,
    price: Number(db.price || 0),
    discount: Number(db.discount || 0),
    rating: Number(db.rating != null ? db.rating : 4.5),
    image: db.image || "",
    stock: Math.max(0, Math.floor(Number(db.stock || 0))),
    is_available: db.is_available != null ? !!db.is_available : true,
    restaurant: {
      id: db.restaurant_id,
      name: db.restaurant_name || "Restaurant",
      logo: db.restaurant_logo || "",
    },
  };
}

const RestaurantMenu = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [availability, setAvailability] = useState("all");

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([fetchRestaurant(id), fetchFoods(id)])
      .then(([rest, foodList]) => {
        if (!active) return;
        setRestaurant(rest);
        setFoods(foodList.map(toCardShape));
      })
      .catch(() => {
        if (active) {
          setRestaurant(null);
          setFoods([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    setActiveCategory("All");
    setSearch("");
    setPriceMin("");
    setPriceMax("");
    setAvailability("all");
  }, [id]);

  // Real price bounds + stock counts derived from this restaurant's menu.
  const { minPrice, maxPrice, inStockCount, outStockCount } = useMemo(() => {
    const prices = foods.map((f) => f.price).filter((p) => Number.isFinite(p) && p > 0);
    const inStock = foods.filter((f) => f.is_available && f.stock > 0).length;
    return {
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      inStockCount: inStock,
      outStockCount: foods.length - inStock,
    };
  }, [foods]);

  // Categories present in THIS restaurant's menu with real counts.
  const categories = useMemo(() => {
    const counts = {};
    foods.forEach((f) => {
      const cat = f.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [foods]);

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setPriceMin("");
    setPriceMax("");
    setAvailability("all");
  };

  const applyPricePreset = (min, max) => {
    setPriceMin(min);
    setPriceMax(max);
  };

  const isInStock = (f) => f.is_available && f.stock > 0;

  const filtered = foods.filter((f) => {
    const matchCategory =
      activeCategory === "All" || f.category === activeCategory;
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchPriceMin = priceMin === "" || Number(f.price) >= Number(priceMin);
    const matchPriceMax = priceMax === "" || Number(f.price) <= Number(priceMax);
    const matchAvailability =
      availability === "all" ||
      (availability === "in" ? isInStock(f) : !isInStock(f));
    return (
      matchCategory &&
      matchSearch &&
      matchPriceMin &&
      matchPriceMax &&
      matchAvailability
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center my-16">
        <h1 className="text-2xl font-bold">Restaurant not found</h1>
        <Link to="/restaurants" className="btn btn-ghost btn-sm mt-4">
          ← All Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="my-8">
      {/* Restaurant photo banner */}
      <div className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden bg-base-200 mb-6">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {restaurant.name}
          </h1>
          <p className="text-white/80 mt-1">
            {restaurant.cuisine}
            {restaurant.address ? ` • ${restaurant.address}` : ""}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <Link to="/restaurants" className="btn btn-ghost btn-sm">
          ← All Restaurants
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="lg:w-72 shrink-0">
          <div className="card bg-base-100 shadow-md p-4 lg:sticky lg:top-24 space-y-5">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-semibold text-base-content">Filters</h2>
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Reset all
              </button>
            </div>

            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full"
            />

            {/* Price range */}
            <div className="px-1">
              <p className="text-sm font-semibold text-base-content mb-2">
                Price Range
                <span className="ml-1 text-xs font-normal text-base-content/50">
                  (৳{minPrice} – ৳{maxPrice})
                </span>
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder={`Min ৳${minPrice}`}
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
                <span className="text-base-content/40">–</span>
                <input
                  type="number"
                  min="0"
                  placeholder={`Max ৳${maxPrice}`}
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { label: "All", min: "", max: "" },
                  { label: `Under ৳${Math.max(200, minPrice)}`, min: "", max: "200" },
                  { label: "৳200–500", min: "200", max: "500" },
                  { label: "Above ৳500", min: "500", max: "" },
                ].map((preset) => {
                  const active =
                    String(priceMin || "") === String(preset.min || "") &&
                    String(priceMax || "") === String(preset.max || "");
                  return (
                    <button
                      key={preset.label}
                      onClick={() => applyPricePreset(preset.min, preset.max)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-primary text-primary-content"
                          : "bg-base-200 text-base-content/60 hover:bg-base-300"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock availability */}
            <div className="px-1">
              <p className="text-sm font-semibold text-base-content mb-2">
                Stock Availability
              </p>
              <div className="space-y-1">
                {[
                  { key: "all", label: "All items", count: foods.length },
                  { key: "in", label: "In stock", count: inStockCount },
                  { key: "out", label: "Out of stock", count: outStockCount },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setAvailability(opt.key)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      availability === opt.key
                        ? "bg-primary text-primary-content font-medium"
                        : "hover:bg-base-200"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="badge badge-ghost badge-sm">{opt.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Categories (this restaurant's menu) */}
            <div className="px-1">
              <h3 className="text-sm font-semibold text-base-content mb-2">
                Categories
              </h3>
              <ul className="menu menu-sm w-full gap-1 !p-0">
                <li>
                  <button
                    onClick={() => setActiveCategory("All")}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      activeCategory === "All"
                        ? "bg-primary text-primary-content font-medium"
                        : "hover:bg-base-200"
                    }`}
                  >
                    <span>All</span>
                    <span className="badge badge-ghost badge-sm">{foods.length}</span>
                  </button>
                </li>
                {categories.length === 0 ? (
                  <ListSkeleton rows={3} avatar={false} />
                ) : (
                  categories.map((cat) => (
                    <li key={cat.name}>
                      <button
                        onClick={() => setActiveCategory(cat.name)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                          activeCategory === cat.name
                            ? "bg-primary text-primary-content font-medium"
                            : "hover:bg-base-200"
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="badge badge-ghost badge-sm">
                          {cat.count}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </aside>

        {/* Food grid */}
        <div className="flex-1">
          {foods.length === 0 ? (
            <div className="text-center text-base-content/50 py-16 bg-base-100 rounded-2xl shadow-sm">
              <span className="text-5xl">🍴</span>
              <h3 className="text-xl font-semibold mt-3">No menu yet</h3>
              <p className="mt-1">
                This restaurant hasn't added any food items yet.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-base-content/50 py-16 bg-base-100 rounded-2xl shadow-sm">
              <p>No dishes match your filters. Try adjusting the price range, stock or category.</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-base-content/50">
                Showing {filtered.length} of {foods.length} dishes
                {availability !== "all"
                  ? ` · ${availability === "in" ? "in stock" : "out of stock"}`
                  : ""}
              </p>
              <div className="food-grid">
                {filtered.map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantMenu;