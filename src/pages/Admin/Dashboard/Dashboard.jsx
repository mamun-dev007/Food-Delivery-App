import { useCallback, useEffect, useState } from "react";
import {
  ShoppingBag,
  Users,
  Store,
  Bike,
  Banknote,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAdminOverview,
  fetchAdminReviews,
  fetchRestaurantRequests,
  fetchRiderRequests,
} from "../../../services/adminService";
import AdminStatCard from "../../../components/admin/AdminStatCard";
import AdminCommissionCard from "../../../components/admin/AdminCommissionCard";
import RevenueChart from "../../../components/admin/RevenueChart";
import OrderAnalyticsChart from "../../../components/admin/OrderAnalyticsChart";
import UserDistributionChart from "../../../components/admin/UserDistributionChart";
import OrderStatusCard from "../../../components/admin/OrderStatusCard";
import TopRestaurants from "../../../components/admin/TopRestaurants";
import TopSellingFoods from "../../../components/admin/TopSellingFoods";
import RecentOrdersTable from "../../../components/admin/RecentOrdersTable";
import RecentUsers from "../../../components/admin/RecentUsers";
import RiderPerformance from "../../../components/admin/RiderPerformance";
import RecentActivity from "../../../components/admin/RecentActivity";
import RestaurantApprovals from "../../../components/admin/RestaurantApprovals";
import CustomerReviews from "../../../components/admin/CustomerReviews";
import QuickActions from "../../../components/admin/QuickActions";
import {
  StatGridSkeleton,
  ChartCardSkeleton,
  TableSkeleton,
} from "../../../components/dashboard/Skeleton";

const fmtMoney = (n) => `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [resRequests, setResRequests] = useState([]);
  const [riderRequests, setRiderRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, rv, rr, rir] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminReviews().catch(() => []),
        fetchRestaurantRequests().catch(() => []),
        fetchRiderRequests().catch(() => []),
      ]);
      setOverview(ov);
      setReviews(rv);
      setResRequests(rr);
      setRiderRequests(rir);
    } catch (err) {
      toast.error(err?.message || "Could not load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !overview) {
    return (
      <div className="space-y-5">
        <StatGridSkeleton count={6} />
        <div className="grid gap-5 lg:grid-cols-3">
          <ChartCardSkeleton className="lg:col-span-2" />
          <ChartCardSkeleton />
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <ChartCardSkeleton className="lg:col-span-2" />
          <ChartCardSkeleton />
        </div>
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  const s = overview.stats || {};

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard
          label="Total Orders"
          value={s.total_orders?.toLocaleString() || "0"}
          icon={ShoppingBag}
          tone="orders"
          change={s.orders_change}
          hint="vs last month"
        />
        <AdminStatCard
          label="Customers"
          value={s.total_customers?.toLocaleString() || "0"}
          icon={Users}
          tone="customers"
          change={s.customers_change}
          hint="vs last month"
        />
        <AdminStatCard
          label="Restaurants"
          value={s.total_restaurants?.toLocaleString() || "0"}
          icon={Store}
          tone="restaurants"
          change={s.restaurants_change}
          hint="vs last month"
        />
        <AdminStatCard
          label="Riders"
          value={s.total_riders?.toLocaleString() || "0"}
          icon={Bike}
          tone="riders"
          change={s.riders_change}
          hint="vs last month"
        />
        <AdminStatCard
          label="Today's Commission"
          value={fmtMoney(overview.revenue?.today?.current)}
          icon={Banknote}
          tone="revenue"
          change={s.revenue_change}
          hint={`this month · payout ${fmtMoney(s.restaurant_payout)}`}
        />
        <AdminStatCard
          label="Pending Orders"
          value={s.pending_orders?.toLocaleString() || "0"}
          icon={Clock}
          tone="pending"
        />
      </div>

      {/* Admin commission card (real data + Line/Bar/Area composed chart) */}
      <AdminCommissionCard stats={s} revenue={overview.revenue} />

      {/* Revenue + distribution */}
      <div className="grid gap-5 lg:grid-cols-3">
        <RevenueChart restaurants={overview.top_restaurants} className="lg:col-span-2" />
        <UserDistributionChart distribution={overview.user_distribution} />
      </div>

      {/* Order analytics + status */}
      <div className="grid gap-5 lg:grid-cols-3">
        <OrderAnalyticsChart counts={overview.order_analytics} className="lg:col-span-2" />
        <OrderStatusCard counts={overview.order_analytics} />
      </div>

      {/* Top restaurants + foods */}
      <div className="grid gap-5 lg:grid-cols-2">
        <TopRestaurants restaurants={overview.top_restaurants} />
        <TopSellingFoods foods={overview.top_foods} />
      </div>

      {/* Recent orders + joined */}
      <div className="grid gap-5 lg:grid-cols-3">
        <RecentOrdersTable orders={overview.recent_orders} className="lg:col-span-2" />
        <RecentUsers users={overview.recent_users} />
      </div>

      {/* Rider perf + activity */}
      <div className="grid gap-5 lg:grid-cols-3">
        <RiderPerformance riders={overview.top_riders} />
        <RecentActivity notifications={overview.recent_notifications} className="lg:col-span-2" />
      </div>

      {/* Approvals + reviews */}
      <div className="grid gap-5 lg:grid-cols-2">
        <RestaurantApprovals requests={resRequests} />
        <CustomerReviews reviews={reviews} />
      </div>

      {/* Quick actions */}
      <QuickActions />

      {riderRequests.length > 0 && (
        <p className="text-xs text-base-content/50">
          {riderRequests.length} rider request(s) pending — verify them from the Riders page.
        </p>
      )}
    </div>
  );
};

export default Dashboard;