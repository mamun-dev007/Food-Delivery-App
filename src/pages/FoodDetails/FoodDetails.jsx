import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Star,
  Clock,
  Store,
  Heart,
  ShoppingCart,
  ChevronLeft,
  Zap,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchFoodById, fetchFoods } from "../../services/foodService";
import { fetchRestaurant } from "../../services/restaurantPublicService";
import { fetchReviews } from "../../services/reviewService";
import { useFavoritesStore } from "../../store/favoritesStore";
import { useAddToCart } from "../../hooks/useAddToCart";
import FoodCard from "../../components/Card/Card";
import { Skeleton } from "../../components/dashboard/Skeleton";
import { effectivePrice } from "../../utils/pricing";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatPrice = (p) => {
  const n = Number(p) || 0;
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

const formatCount = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return String(num);
};

const getRelativeTime = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const getBadge = (food) => {
  if (Number(food.discount) > 0)
    return { label: `${food.discount}% OFF`, cls: "bg-red-500" };
  if (Number(food.rating) >= 4.7)
    return { label: "Best Seller", cls: "bg-purple-600" };
  return { label: "Popular", cls: "bg-emerald-600" };
};

const toCardShape = (db) => ({
  id: db.id || db.food_id,
  name: db.name || db.food_name,
  category: db.category,
  price: Number(db.price || 0),
  rating: Number(db.rating != null ? db.rating : 4.5),
  image: db.image || "",
  description: db.description || "",
  discount: Number(db.discount || 0),
  ingredients: db.ingredients || [],
  stock: Number(db.stock || 0),
  is_available: db.is_available != null ? !!db.is_available : true,
  reviewCount: Math.max(Number(db.review_count || 0), 0),
  deliveryTime: db.delivery_time || "",
  restaurant: {
    id: db.restaurant_id,
    name: db.restaurant_name || "Restaurant",
    logo: db.restaurant_logo || "",
  },
});

// ---------------------------------------------------------------------------
// Star row
// ---------------------------------------------------------------------------
const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.round(Number(rating) || 0)
            ? "fill-amber-400 text-amber-400"
            : "fill-base-200 text-base-300"
        }`}
      />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const FoodDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const [food, setFood] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchFoodById(id)
      .then((db) => {
        if (!active) return;
        setFood(db ? toCardShape(db) : null);
      })
      .catch(() => {
        if (active) setFood(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Restaurant info (real MongoDB data).
  useEffect(() => {
    if (!food?.restaurant?.id) {
      setRestaurant(null);
      return;
    }
    let active = true;
    fetchRestaurant(food.restaurant.id)
      .then((r) => active && setRestaurant(r))
      .catch(() => active && setRestaurant(null));
    return () => {
      active = false;
    };
  }, [food?.restaurant?.id]);

  // Real customer reviews for this exact dish.
  useEffect(() => {
    if (!food?.name) {
      setReviews([]);
      return;
    }
    let active = true;
    fetchReviews(food.name)
      .then((list) => active && setReviews(list.slice(0, 6)))
      .catch(() => active && setReviews([]));
    return () => {
      active = false;
    };
  }, [food?.name]);

  // Related foods from the same category (MongoDB data, excluding this item).
  useEffect(() => {
    if (!food) return;
    let active = true;
    fetchFoods()
      .then((list) => {
        if (!active) return;
        const shaped = list.map(toCardShape);
        const sameCategory = shaped.filter(
          (f) => f.category === food.category && f.id !== food.id
        );
        const rest = shaped.filter((f) => f.id !== food.id);
        setRelated(active ? (sameCategory.length >= 2 ? sameCategory : rest).slice(0, 8) : []);
      })
      .catch(() => active && setRelated([]));
    return () => {
      active = false;
    };
  }, [food]);

  const foodId = food?.id;
  const isFavorite = favorites.some((f) => f.id === foodId);
  const soldOut =
    !!food &&
    (food.is_available === false ||
      (food.stock != null && Number(food.stock) <= 0));
  const badge = useMemo(() => (food ? getBadge(food) : null), [food]);
  const oldPrice =
    food && food.discount > 0 ? Number(food.price || 0) : null;
  const finalPrice = effectivePrice(food?.price, food?.discount);
  const handleFavorite = () => {
    if (!food) return;
    toggleFavorite(food);
    toast(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleAdd = () => {
    if (!food || soldOut) return;
    addToCart(food, 1);
  };

  const handleBuyNow = () => {
    if (!food || soldOut) return;
    const ok = addToCart(food, 1);
    if (ok) navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="mx-auto my-6 max-w-6xl animate-pulse px-4 md:my-10">
        <Skeleton className="h-4 w-32" />
        <div className="mt-6 flex gap-5 rounded-2xl border border-base-200 bg-base-100 p-4 md:p-6">
          <Skeleton className="h-40 w-40 shrink-0 rounded-2xl md:h-52 md:w-60" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="my-16 text-center">
        <span className="text-6xl">🍽️</span>
        <h1 className="mt-4 text-2xl font-bold">Food not found</h1>
        <p className="mt-2 text-base-content/60">
          This dish may have been removed from the menu.
        </p>
        <Link to="/menu" className="btn btn-primary btn-sm mt-6">
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 md:pb-10 md:py-8">
      {/* ---- Mobile compact header ---- */}
      <div className="mb-4 flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-base-200 bg-base-100 text-base-content shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 truncate text-lg font-bold text-base-content">
          {food.name}
        </h1>
        <button
          type="button"
          onClick={handleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-base-200 bg-base-100 shadow-sm"
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-base-content/60"
            }`}
          />
        </button>
      </div>

      {/* ---- Desktop breadcrumb ---- */}
      <nav className="mb-6 hidden items-center gap-2 text-sm text-base-content/60 md:flex">
        <Link to="/menu" className="transition-colors hover:text-purple-600">
          ← Back to Foods
        </Link>
        <span>/</span>
        <span className="text-base-content/40">Food Details</span>
      </nav>

      {/* ---- Main card: small photo + all details ---- */}
      <div className="flex flex-col gap-5 rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm sm:flex-row sm:p-6">
        {/* Photo (small) */}
        <div className="relative shrink-0 overflow-hidden rounded-2xl sm:w-52 md:w-60">
          <div className="aspect-square w-full">
            <img
              src={food.image}
              alt={food.name}
              className="h-full w-full object-cover"
            />
          </div>
          {badge && (
            <span
              className={`absolute top-3 left-3 rounded-full ${badge.cls} px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm`}
            >
              {badge.label}
            </span>
          )}
          <button
            type="button"
            onClick={handleFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-md transition-colors hover:text-red-500"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </button>
        </div>

        {/* Details (right side) */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            {food.category && (
              <span className="inline-block rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-purple-600 dark:bg-purple-500/10">
                {food.category}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-base-content/60">
              <Clock className="h-3.5 w-3.5" />
              {food.deliveryTime || "25–35 min"}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-base-content md:text-3xl">
            {food.name}
          </h1>

          <div className="flex items-center gap-2 text-sm text-base-content/60">
            {food.restaurant?.logo ? (
              <img
                src={food.restaurant.logo}
                alt=""
                loading="lazy"
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <Store className="h-4 w-4" />
            )}
            <Link
              to={food.restaurant?.id ? `/restaurants/${food.restaurant.id}` : "/restaurants"}
              className="font-medium text-base-content transition-colors hover:text-purple-600"
            >
              {food.restaurant?.name || "Restaurant"}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-base-content">
                {Number(food.rating).toFixed(1)}
              </span>
            </span>
            <span className="text-sm text-base-content/50">
              ({formatCount(food.reviewCount)} reviews)
            </span>
          </div>

          {food.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-base-content/70">
              {food.description}
            </p>
          )}

          {food.ingredients?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {food.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="rounded-full border border-base-200 bg-base-200/50 px-2.5 py-0.5 text-[11px] text-base-content/60"
                >
                  {ing}
                </span>
              ))}
            </div>
          )}

          {/* Price + actions */}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-base-content">
                ৳{formatPrice(finalPrice)}
              </span>
              {oldPrice != null && (
                <span className="text-sm text-base-content/40 line-through">
                  ৳{formatPrice(oldPrice)}
                </span>
              )}
            </div>
            {!soldOut ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:bg-emerald-500/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Only {food.stock} left in stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 dark:bg-red-500/10">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Out of stock
              </span>
            )}
            <div className="ml-auto hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={handleAdd}
                disabled={soldOut}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={soldOut}
                className="flex items-center gap-2 rounded-xl border-2 border-purple-600 bg-white px-5 py-2.5 text-sm font-semibold text-purple-600 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Zap className="h-4 w-4" />
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Restaurant information ---- */}
      {restaurant && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-base-content">
            Restaurant Information
          </h2>
          <div className="flex flex-col gap-6 rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm sm:flex-row sm:items-center">
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="h-20 w-20 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-3xl dark:bg-purple-500/10">
                {restaurant.name?.charAt(0) || "🍽️"}
              </div>
            )}
            <div className="flex-1">
              <Link
                to={`/restaurants/${restaurant.id}`}
                className="text-xl font-bold text-base-content transition-colors hover:text-purple-600"
              >
                {restaurant.name}
              </Link>
              <p className="mt-1 text-sm text-base-content/60">{restaurant.cuisine}</p>
              {restaurant.address && (
                <p className="mt-1 flex items-center gap-1 text-sm text-base-content/50">
                  <MapPin className="h-4 w-4" />
                  {restaurant.address}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-center sm:flex sm:gap-8 sm:text-left">
              <div>
                <p className="text-lg font-bold text-base-content">
                  {Number(restaurant.rating || 0) > 0
                    ? Number(restaurant.rating).toFixed(1)
                    : "New"}
                </p>
                <p className="text-xs text-base-content/50">Rating</p>
              </div>
              <div>
                <p className="text-lg font-bold text-base-content">
                  ৳{formatPrice(restaurant.delivery_charge)}
                </p>
                <p className="text-xs text-base-content/50">Delivery fee</p>
              </div>
              <div>
                <p className="text-lg font-bold text-base-content">
                  ৳{formatPrice(restaurant.min_order)}
                </p>
                <p className="text-xs text-base-content/50">Minimum order</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---- Customer reviews (real MongoDB data) ---- */}
      {!loading && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-base-content">
              Customer Reviews
            </h2>
            <span className="badge badge-lg badge-ghost">
              {formatCount(food.reviewCount)}
            </span>
          </div>
          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center text-base-content/50">
              <span className="text-4xl">💬</span>
              <p className="mt-3 font-medium">No reviews yet</p>
              <p className="mt-1 text-sm">
                Be the first to share your experience with this dish.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {reviews.map((r) => (
                <div
                  key={r.id || `${r.name}-${r.created_at}`}
                  className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {r.avatar_url ? (
                      <img
                        src={r.avatar_url}
                        alt={r.name}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-purple-500/20"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-600/10 font-bold text-purple-600">
                        {getInitials(r.name)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-base-content">{r.name}</p>
                      <p className="text-xs text-base-content/50">
                        {getRelativeTime(r.created_at)}
                      </p>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="mt-3 text-base-content/70">“{r.text}”</p>
                  {r.dish && (
                    <p className="mt-2 text-xs text-base-content/40">
                      Ordered: {r.dish}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---- Related foods (horizontal scroll permitted here only) ---- */}
      {related.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-base-content">
              Related Foods
            </h2>
            <Link
              to="/menu"
              className="text-sm font-medium text-purple-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2">
            {related.map((f) => (
              <div
                key={f.id}
                className="w-64 shrink-0 snap-start sm:w-72"
              >
                <FoodCard food={f} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Sticky mobile action bar ---- */}
      <div className="sticky bottom-4 z-30 md:hidden">
        <div className="flex items-center gap-3 rounded-2xl border border-base-200 bg-white p-3 shadow-xl">
          <div className="flex items-center gap-1.5 pl-1">
            {!soldOut ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">
                  {food.stock} in stock
                </span>
              </>
            ) : (
              <span className="text-xs font-medium text-red-600">Out of stock</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart — ৳{formatPrice(finalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodDetails;