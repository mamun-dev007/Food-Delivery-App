import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchOwnerAnalytics } from "../../../services/restaurantService";
import { StatGridSkeleton, ChartCardSkeleton } from "../../../components/dashboard/Skeleton";

const STATUS_COLORS = {
  Pending: "#f59e0b",
  Preparing: "#0ea5e9",
  "On The Way": "#6366f1",
  Delivered: "#22c55e",
  Cancelled: "#ef4444",
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchOwnerAnalytics()
      .then((a) => {
        if (active) setAnalytics(a);
      })
      .catch(() => {
        if (active) setAnalytics(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <>
        <StatGridSkeleton />
        <ChartCardSkeleton className="lg:col-span-2" />
      </>
    );
  }

  const a = analytics || {
    today: { orders: 0, revenue: 0 },
    totals: { total_orders: 0, pending: 0, delivered: 0 },
    status_counts: {},
    popular_foods: [],
    daily_sales: [],
    monthly_sales: [],
    revenue_by_payment: {},
  };

  const statusData = Object.entries(a.status_counts || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const paymentData = Object.entries(a.revenue_by_payment || {}).map(
    ([name, value]) => ({ name, amount: value })
  );

  const conversion = a.totals.total_orders
    ? Math.round((a.totals.delivered / a.totals.total_orders) * 100)
    : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold">Sales Analytics</h1>
      <p className="text-base-content/60 mt-1">
        Deep dive into your restaurant's sales performance.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Today's Revenue</div>
            <div className="stat-value text-2xl">{a.today.revenue} ৳</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Orders</div>
            <div className="stat-value text-2xl">{a.totals.total_orders}</div>
            <div className="stat-desc">{a.today.orders} today</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Delivered Orders</div>
            <div className="stat-value text-2xl">{a.totals.delivered}</div>
            <div className="stat-desc">Pending: {a.totals.pending}</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Completion Rate</div>
            <div className="stat-value text-2xl">{conversion}%</div>
            <div className="stat-desc">Delivered ÷ all orders</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-2">Daily Sales Trend</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={a.daily_sales}>
                <defs>
                  <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Revenue (৳)"
                  stroke="#2563eb"
                  fill="url(#dailyGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-2">Monthly Sales</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={a.monthly_sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" name="Revenue (৳)" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-2">Order Status Distribution</h2>
            {statusData.length === 0 || statusData.every((d) => d.value === 0) ? (
              <p className="text-base-content/50 py-14 text-center">No orders yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-2">Revenue by Payment Method</h2>
            {paymentData.length === 0 ? (
              <p className="text-base-content/50 py-14 text-center">No payment data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" name="Revenue (৳)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md mt-6">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Popular Foods</h2>
            <Link to="/restaurant/foods" className="btn btn-sm btn-outline">
              Manage foods
            </Link>
          </div>
          {a.popular_foods.length === 0 ? (
            <p className="text-base-content/50 py-8 text-center">
              No orders yet — popular foods will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dish</th>
                    <th className="text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {a.popular_foods.map((f, idx) => (
                    <tr key={f.name}>
                      <td>{idx + 1}</td>
                      <td className="font-medium">{f.name}</td>
                      <td className="text-right">{f.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;