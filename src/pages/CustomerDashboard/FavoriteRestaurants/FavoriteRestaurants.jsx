import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, HeartOff, Store } from "lucide-react";
import toast from "react-hot-toast";
import { useOrderSummary } from "../../../hooks/useOrderSummary";
import { useFavoritesStore } from "../../../store/favoritesStore";
import {
  loadFavoriteRestaurants,
  saveFavoriteRestaurants,
} from "../../../services/customerService";
import CustomerEmptyState from "../../../components/customer/EmptyState";
import { FoodPhoto } from "../../../components/admin/SmartImage";
import { ListSkeleton } from "../../../components/dashboard/Skeleton";

const FavoriteRestaurants = () => {
  const { orders, loading } = useOrderSummary("year");
  const favorites = useFavoritesStore((s) => s.favorites);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    setSaved(loadFavoriteRestaurants());
  }, []);

  const frequent = useMemo(() => {
    const byRestaurant = new Map();
    orders.forEach((o) => {
      if (!o.restaurant_id && !o.restaurant_name) return;
      const key = String(o.restaurant_id || o.restaurant_name);
      const entry = byRestaurant.get(key) || {
        id: o.restaurant_id,
        name: o.restaurant_name || "Restaurant",
        logo: o.logo_url || o.restaurant_logo || "",
        orders: 0,
        spent: 0,
      };
      entry.orders += 1;
      if (o.status !== "Cancelled") entry.spent += Number(o.total_amount || 0);
      byRestaurant.set(key, entry);
    });
    return [...byRestaurant.values()]
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6);
  }, [orders]);

  const isSaved = (r) => saved.some((s) => String(s.id) === String(r.id || r.name));

  const toggleSave = (r) => {
    let next;
    if (isSaved(r)) {
      next = saved.filter((s) => String(s.id) !== String(r.id || r.name));
      toast.success("Removed from saved restaurants.");
    } else {
      next = [...saved, { id: r.id || r.name, name: r.name, logo: r.logo || "" }];
      toast.success("Saved to your restaurants!");
    }
    setSaved(next);
    saveFavoriteRestaurants(next);
  };

  const RestaurantCard = ({ r, orderCount = null, spent = null }) => (
    <div className="flex flex-col rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Link to={`/restaurants/${r.id}`} className="shrink-0">
          <FoodPhoto src={r.logo} alt={r.name} className="h-16 w-16 rounded-xl" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/restaurants/${r.id}`}
            className="block truncate font-bold text-base-content hover:text-primary"
          >
            {r.name}
          </Link>
          {orderCount != null && (
            <p className="text-xs text-base-content/50">
              {orderCount} order{orderCount > 1 ? "s" : ""} this year
            </p>
          )}
        </div>
        <button
          onClick={() => toggleSave(r)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            isSaved(r)
              ? "border-rose-200 bg-rose-500/10 text-rose-500"
              : "border-base-300 bg-base-100 text-base-content/40 hover:border-rose-300 hover:text-rose-500"
          }`}
          aria-label={isSaved(r) ? "Remove from favorites" : "Add to favorites"}
        >
          {isSaved(r) ? <HeartOff className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-base-200 pt-3">
        <Link
          to={`/restaurants/${r.id}`}
          className="text-xs font-bold text-primary hover:underline"
        >
          View Menu
        </Link>
        {spent != null && (
          <span className="text-xs font-semibold text-base-content/50">
            ৳{Math.round(spent).toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            Favorite Restaurants
          </h1>
          <p className="text-sm text-base-content/50">
            Your go-to spots, saved for quick access.
          </p>
        </div>
        <ListSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Favorite Restaurants
        </h1>
        <p className="text-sm text-base-content/50">
          Save the places you love, and revisit your most-ordered restaurants.
        </p>
      </div>

      {/* Saved restaurants */}
      {saved.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-bold text-base-content">Your Saved Restaurants</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {saved.map((r) => (
              <RestaurantCard key={String(r.id)} r={r} />
            ))}
          </div>
        </section>
      )}

      {/* Frequently ordered (real data) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-base-content">Frequently Ordered</h2>
          {frequent.length > 0 && (
            <p className="text-xs text-base-content/50">
              Toggle the heart to save a restaurant
            </p>
          )}
        </div>
        {frequent.length === 0 ? (
          <CustomerEmptyState
            icon={Store}
            title={saved.length > 0 ? "No order history yet" : "No favorited restaurants yet"}
            message={
              saved.length > 0
                ? "Once you order from a restaurant, it will show up here too."
                : "Save restaurants with the heart, or start ordering to build this list."
            }
            action={
              <Link
                to="/restaurants"
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content"
              >
                Explore Restaurants
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {frequent.map((r) => (
              <RestaurantCard
                key={String(r.id || r.name)}
                r={r}
                orderCount={r.orders}
                spent={r.spent}
              />
            ))}
          </div>
        )}
      </section>

      {/* Favorite dishes (from the favorites store) */}
      {favorites.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-bold text-base-content">
            From Your Favorite Dishes
          </h2>
          <div className="flex flex-wrap gap-2">
            {favorites.slice(0, 8).map((f) => (
              <Link
                key={f.id}
                to={`/restaurants/${f.restaurant?.id || ""}?food=${encodeURIComponent(f.id)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-sm font-medium text-base-content/70 transition-colors hover:border-rose-300 hover:text-rose-500"
              >
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                {f.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FavoriteRestaurants;