import { useNavigate } from "react-router-dom";
import { ShoppingCart, Star, Heart, Store, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useFavoritesStore } from "../../store/favoritesStore";
import { useAddToCart } from "../../hooks/useAddToCart";
import { clampDiscount, effectivePrice } from "../../utils/pricing";

// ---------------------------------------------------------------------------
// Premium Food Card
// ---------------------------------------------------------------------------
// White card + 16:9 cover image + promo badge + favorite heart + rating/
// restaurant/delivery meta + price + purple "Add to Cart" button.
// Whole card is openable (role="link") and navigates to /food/:id. Inner
// buttons call stopPropagation so they never trigger navigation.
// ---------------------------------------------------------------------------

const DELIVERY_SLOTS = [
  { min: 20, max: 30 },
  { min: 25, max: 35 },
  { min: 30, max: 40 },
  { min: 30, max: 45 },
  { min: 15, max: 25 },
];

const formatCount = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return String(num);
};

const formatPrice = (p) => {
  const n = Number(p) || 0;
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

const getDeliveryTime = (food) => {
  if (food.deliveryTime) return food.deliveryTime;
  const idx =
    Math.abs(Number(food.id) || 1) % DELIVERY_SLOTS.length;
  const slot = DELIVERY_SLOTS[idx];
  return `${slot.min}–${slot.max} min`;
};

const getBadge = (food) => {
  if (food.badge) return food.badge;
  if (Number(food.discount) > 0)
    return { label: `${food.discount}% OFF`, cls: "bg-red-500" };
  if (Number(food.rating) >= 4.7)
    return { label: "Best Seller", cls: "bg-purple-600" };
  return { label: "Popular", cls: "bg-emerald-600" };
};

const FoodCard = ({ food }) => {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = favorites.some((f) => f.id === food.id);

  const price = Number(food.price || 0);
  const discount = clampDiscount(food.discount);
  const finalPrice = effectivePrice(price, discount);
  const badge = getBadge(food);
  const deliveryTime = getDeliveryTime(food);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(food);
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(food);
    toast(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const openDetails = () => navigate(`/food/${food.id}`);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetails();
        }
      }}
      aria-label={`View ${food.name} details`}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-base-200 bg-base-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    >
      {/* 16:9 cover image + overlay */}
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={food.image}
          alt={food.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {badge && (
          <span
            className={`absolute top-3 left-3 rounded-full ${badge.cls} px-3 py-1 text-xs font-semibold text-white shadow-sm`}
          >
            {badge.label}
          </span>
        )}
        <button
          type="button"
          onClick={handleFavorite}
          aria-label={
            isFavorite
              ? `Remove ${food.name} from favorites`
              : `Add ${food.name} to favorites`
          }
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-md transition-colors hover:text-red-500"
        >
          <Heart
            className={`h-4 w-4 ${
              isFavorite ? "fill-red-500 text-red-500" : ""
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-lg font-bold text-base-content">
          {food.name}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-base-content/60">
          {food.restaurant?.logo ? (
            <img
              src={food.restaurant.logo}
              alt=""
              loading="lazy"
              className="h-4 w-4 shrink-0 rounded-full object-cover"
            />
          ) : (
            <Store className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            {food.restaurant?.name || "Restaurant"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 font-semibold text-base-content">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {Number(food.rating).toFixed(1)}
          </span>
          <span className="text-base-content/50">
            ({formatCount(food.reviewCount || food.review_count)})
          </span>
          <span className="ml-auto flex items-center gap-1 text-base-content/50">
            <Clock className="h-4 w-4" />
            {deliveryTime}
          </span>
        </div>

        <p className="line-clamp-1 text-sm text-base-content/60">
          {food.description || "Delicious, freshly prepared and delivered hot."}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-base-content">
              ৳{formatPrice(finalPrice)}
            </span>
            {discount > 0 && (
              <span className="text-sm text-base-content/40 line-through">
                ৳{formatPrice(price)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Add ${food.name} to cart`}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
};

export default FoodCard;