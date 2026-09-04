import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, Heart, ReceiptText, ShoppingCart } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useFavoritesStore } from "../../../store/favoritesStore";
import { useOrderSummary } from "../../../hooks/useOrderSummary";
import {
  fetchActiveCoupons,
  loadFavoriteRestaurants,
  saveFavoriteRestaurants,
} from "../../../services/customerService";
import { fmtMoney } from "../../../components/rider/shared";
import { orderIsActive } from "../../../utils/order";
import WelcomeBanner from "../../../components/customer/WelcomeBanner";
import StatCard from "../../../components/customer/StatCard";
import ActiveOrderCard from "../../../components/customer/ActiveOrderCard";
import RecentOrderCard from "../../../components/customer/RecentOrderCard";
import PromotionCard from "../../../components/customer/PromotionCard";
import CartWidget from "../../../components/customer/CartWidget";
import FavoriteCard from "../../../components/customer/FavoriteCard";
import QuickShop from "../../../components/customer/QuickShop";

const SectionCard = ({ title, right, children, className = "" }) => (
  <section className={`rounded-2xl border border-base-300/60 bg-base-100 p-5 shadow-sm ${className}`}>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-bold text-base-content">{title}</h2>
      {right}
    </div>
    {children}
  </section>
);

const SectionLink = ({ to, children }) => (
  <Link
    to={to}
    className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-focus"
  >
    {children} <ArrowRight className="h-3.5 w-3.5" />
  </Link>
);

const EmptyHint = ({ text }) => (
  <p className="rounded-xl bg-base-100/70 px-4 py-6 text-center text-sm text-base-content/40">{text}</p>
);

// Lightweight skeletons in the dashboard palette.
const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded-2xl bg-base-300/60 ${className}`} />
);

const Overview = () => {
  const user = useAuthStore((s) => s.user);
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const { orders, loading: ordersLoading } = useOrderSummary("year");
  const [coupons, setCoupons] = useState([]);
  const [savedRestaurants, setSavedRestaurants] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchActiveCoupons().then((list) => mounted && setCoupons(list));
    setSavedRestaurants(loadFavoriteRestaurants());
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const active = orders.filter((o) => orderIsActive(o.status)).length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const totalSpent = orders.reduce(
      (sum, o) => sum + (o.status !== "Cancelled" ? Number(o.total_amount || 0) : 0),
      0,
    );
    return { totalOrders: orders.length, active, delivered, totalSpent };
  }, [orders]);

  const activeOrders = useMemo(() => orders.filter((o) => orderIsActive(o.status)), [orders]);
  const recentOrders = useMemo(
    () => orders.filter((o) => o.status === "Delivered" || o.status === "Cancelled").slice(0, 3),
    [orders],
  );

  const firstName = (user?.name || "Foodie").trim().split(" ")[0];

  // Favorites: saved restaurants (persisted) + favorited dishes (store).
  const favoriteItems = useMemo(
    () => [
      ...savedRestaurants.map((r) => ({
        id: r.id,
        name: r.name,
        image: r.logo || "",
        rating: "4.5",
        cuisine: "Saved",
        saved: true,
      })),
      ...favorites.slice(0, 4),
    ],
    [savedRestaurants, favorites],
  );

  const toggleSavedRestaurant = (item) => {
    if (item.saved) {
      const next = savedRestaurants.filter((s) => String(s.id) !== String(item.id));
      setSavedRestaurants(next);
      saveFavoriteRestaurants(next);
      return;
    }
    toggleFavorite(item);
  };

  if (ordersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-64" />
          </div>
          <div className="hidden space-y-4 lg:block">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <WelcomeBanner name={firstName} activeCount={stats.active} />

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={ReceiptText}
          tint="violet"
          sub="All time orders"
        />
        <StatCard
          label="Active Orders"
          value={stats.active}
          icon={Clock}
          tint="amber"
          sub="Currently being prepared or delivered"
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          icon={CheckCircle2}
          tint="green"
          sub="Successfully received orders"
        />
        <StatCard
          label="Total Spent"
          value={fmtMoney(stats.totalSpent)}
          icon={ShoppingCart}
          tint="orange"
          sub="Excluding cancelled orders"
        />
      </div>

      {/* Active orders + right rail */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Active orders */}
          <SectionCard
            title="Active Orders"
            right={<SectionLink to="/customer/dashboard/active-orders">View All</SectionLink>}
          >
            {activeOrders.length > 0 ? (
              <ActiveOrderCard order={activeOrders[0]} />
            ) : (
              <EmptyHint text="No active orders right now. Hungry? Browse the menu!" />
            )}
          </SectionCard>

          {/* Recent orders */}
          <SectionCard
            title="Recent Orders"
            right={
              <SectionLink to="/customer/dashboard/order-history">Order History</SectionLink>
            }
          >
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((o) => (
                  <RecentOrderCard key={o.id} order={o} />
                ))}
              </div>
            ) : (
              <EmptyHint text="Your completed orders will appear here." />
            )}
          </SectionCard>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {/* Promotions */}
          <SectionCard
            title="Promotions"
            right={<SectionLink to="/offers">View All</SectionLink>}
          >
            {coupons.length > 0 ? (
              <div className="space-y-2.5">
                {coupons.slice(0, 3).map((c) => (
                  <PromotionCard
                    key={c.id}
                    code={c.code}
                    description={
                      c.description ||
                      (c.type === "Percentage"
                        ? `${c.value}% off`
                        : c.type === "Flat Amount"
                          ? `${fmtMoney(c.value)} off`
                          : "Free delivery")
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyHint text="No active promo codes right now." />
            )}
          </SectionCard>

          {/* My cart */}
          <SectionCard
            title="My Cart"
            right={<SectionLink to="/customer/cart">Manage</SectionLink>}
          >
            <CartWidget />
          </SectionCard>

          {/* Favorites */}
          <SectionCard
            title="Favorites"
            right={
              <SectionLink to="/customer/dashboard/favorite-restaurants">View All</SectionLink>
            }
          >
            {favoriteItems.length > 0 ? (
              <div className="space-y-3">
                {favoriteItems.slice(0, 4).map((item) => (
                  <FavoriteCard
                    key={String(item.id)}
                    item={item}
                    onToggle={toggleSavedRestaurant}
                  />
                ))}
              </div>
            ) : (
              <EmptyHint text={
                <>
                  Tap the <Heart className="inline h-3.5 w-3.5" /> on any dish to save it here.
                </>
              } />
            )}
          </SectionCard>

          {/* Quick shop */}
          <SectionCard title="Quick Shop">
            <QuickShop />
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default Overview;