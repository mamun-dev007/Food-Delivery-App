import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchDashboardData } from "../../services/dashboardService";
import { useDashboardRange } from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import DateRangePicker from "../../components/dashboard/DateRangePicker";
import StatCard from "../../components/dashboard/StatCard";
import SalesOverviewChart from "../../components/dashboard/SalesOverviewChart";
import CategoryChart from "../../components/dashboard/CategoryChart";
import OrdersOverviewChart from "../../components/dashboard/OrdersOverviewChart";
import OrderTypesCard from "../../components/dashboard/OrderTypesCard";
import RecentOrders from "../../components/dashboard/RecentOrders";
import TopSellingFoods from "../../components/dashboard/TopSellingFoods";
import RecentActivity from "../../components/dashboard/RecentActivity";
import CustomerReviews from "../../components/dashboard/CustomerReviews";
import StockChart from "../../components/dashboard/StockChart";
import { DashboardLoading } from "../../components/dashboard/Skeleton";

const OwnerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { range, setRange } = useDashboardRange();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchDashboardData());
    } catch {
      toast.error("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your restaurant today."
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      {loading ? (
        <DashboardLoading />
      ) : !data ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 py-24 text-center text-base-content/50">
          No dashboard data available yet.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.stats.map((s) => (
              <StatCard key={s.key} stat={s} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SalesOverviewChart data={data.sales} />
            <CategoryChart data={data.topCategories} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <OrdersOverviewChart data={data.dailyOrders} />
            <OrderTypesCard data={data.orderTypes} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StockChart data={data.stock} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <RecentOrders orders={data.recentOrders} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TopSellingFoods foods={data.topFoods} />
            <RecentActivity items={data.activity} />
            <CustomerReviews reviews={data.reviews} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;