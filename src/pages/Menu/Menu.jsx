import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FoodCard from "../../components/Card/Card";
import { fetchFoods, fetchFoodCategories } from "../../services/foodService";
import { CardGridSkeleton, ListSkeleton } from "../../components/dashboard/Skeleton";

// Convert a food returned by the backend (MongoDB) into the card shape with
// the extra fields the premium card renders (description, discount, review
// count, delivery estimate, restaurant reference, stock + availability).
function toCardShape(db) {
  return {
    id: db.id || db.food_id,
    name: db.name || db.food_name,
    category: db.category,
    price: Number(db.price || 0),
    rating: Number(db.rating != null ? db.rating : 4.5),
    image: db.image || "",
    description: db.description || "",
    discount: Number(db.discount || 0),
    reviewCount: Math.max(Number(db.review_count || 0), 0),
    deliveryTime: db.delivery_time || "",
    stock: Math.max(0, Math.floor(Number(db.stock || 0))),
    is_available: db.is_available != null ? !!db.is_available : true,
    restaurant: {
      id: db.restaurant_id,
      name: db.restaurant_name || "Restaurant",
      logo: db.restaurant_logo || "",
    },
  };
}

const PAGE_SIZE = 20;

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "All"
  );
  const [search, setSearch] = useState("");
  const [dbFoods, setDbFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [availability, setAvailability] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveCategory(searchParams.get("category") || "All");
    setPage(1);
  }, [searchParams]);

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

  useEffect(() => {
    let active = true;
    fetchFoods()
      .then((list) => {
        if (active) setDbFoods(list.map(toCardShape));
      })
      .catch(() => {
        if (active) setDbFoods([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const allFoods = useMemo(() => dbFoods, [dbFoods]);

  // Real price bounds + stock counts derived from the loaded menu.
  const { minPrice, maxPrice, inStockCount, outStockCount } = useMemo(() => {
    const prices = allFoods.map((f) => f.price).filter((p) => Number.isFinite(p) && p > 0);
    const inStock = allFoods.filter((f) => f.is_available && f.stock > 0).length;
    return {
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      inStockCount: inStock,
      outStockCount: allFoods.length - inStock,
    };
  }, [allFoods]);

  const selectCategory = (cat) => {
    setActiveCategory(cat);
    setPage(1);
    if (cat === "All") {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setPriceMin("");
    setPriceMax("");
    setAvailability("all");
    setActiveCategory("All");
    setSearchParams({});
    setPage(1);
  };

  const applyPricePreset = (min, max) => {
    setPriceMin(min);
    setPriceMax(max);
    setPage(1);
  };

  const isInStock = (f) => f.is_available && f.stock > 0;

  const filtered = allFoods.filter((f) => {
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

  const totalItems = allFoods.length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="my-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Our Menu</h1>
        <p className="text-base-content/60 mt-2">
          Explore our dishes and find your next favorite meal.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
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
                  onChange={(e) => {
                    setPriceMin(e.target.value);
                    setPage(1);
                  }}
                  className="input input-bordered input-sm w-full"
                />
                <span className="text-base-content/40">–</span>
                <input
                  type="number"
                  min="0"
                  placeholder={`Max ৳${maxPrice}`}
                  value={priceMax}
                  onChange={(e) => {
                    setPriceMax(e.target.value);
                    setPage(1);
                  }}
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
                  { key: "all", label: "All items", count: allFoods.length },
                  { key: "in", label: "In stock", count: inStockCount },
                  { key: "out", label: "Out of stock", count: outStockCount },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setAvailability(opt.key);
                      setPage(1);
                    }}
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

            {/* Categories */}
            <div className="px-1">
              <h3 className="text-sm font-semibold text-base-content mb-2">
                Categories
              </h3>
              <ul className="menu menu-sm w-full gap-1 !p-0">
                <li>
                  <button
                    onClick={() => selectCategory("All")}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      activeCategory === "All"
                        ? "bg-primary text-primary-content font-medium"
                        : "hover:bg-base-200"
                    }`}
                  >
                    <span>All</span>
                    <span className="badge badge-ghost badge-sm">
                      {totalItems}
                    </span>
                  </button>
                </li>
                {loading ? (
                  <ListSkeleton rows={4} avatar={false} />
                ) : (
                  categories.map((cat) => (
                    <li key={cat.name}>
                      <button
                        onClick={() => selectCategory(cat.name)}
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
          {loading ? (
            <CardGridSkeleton count={8} />
          ) : filtered.length === 0 ? (
            <p className="text-center text-base-content/50 py-16">
              No dishes match your filters. Try adjusting the price range, stock
              or category.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-base-content/50">
                Showing {filtered.length} of {totalItems} dishes
                {availability !== "all"
                  ? ` · ${availability === "in" ? "in stock" : "out of stock"}`
                  : ""}
              </p>
              <div className="food-grid">
                {paginated.map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="btn btn-sm btn-ghost border border-base-300 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`btn btn-sm ${
                          n === safePage
                            ? "btn-primary"
                            : "btn-ghost border border-base-300"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={safePage === totalPages}
                    className="btn btn-sm btn-ghost border border-base-300 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
