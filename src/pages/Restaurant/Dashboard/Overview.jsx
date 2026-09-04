import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  DollarSign,
  UtensilsCrossed,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuthStore } from "../../../store/authStore";
import {
  fetchOwnerAnalytics,
} from "../../../services/restaurantService";

const STATUS_COLORS = {
  Pending: "#f59e0b",
  Preparing: "#0ea5e9",
  "On The Way": "#6366f1",
  Delivered: "#22c55e",
  Cancelled: "#ef4444",
};

const Overview = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

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
      <div className="flex items-center justify-center p-16 text-base-content/50 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  const a = analytics || {
    today: { orders: 0, revenue: 0 },
    totals: { total_orders: 0, total_foods: 0, pending: 0, delivered: 0 },
    status_counts: {},
    popular_foods: [],
    daily_sales: [],
    monthly_sales: [],
    revenue_by_payment: {},
  };

  const stats = [
    {
      label: "Today's Orders",
      value: a.today.orders,
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      label: "Today's Net (95%)",
      value: `${a.today.revenue} ৳`,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      label: "Total Foods",
      value: a.totals.total_foods,
      icon: UtensilsCrossed,
      color: "bg-orange-500",
    },
    {
      label: "Pending Orders",
      value: a.totals.pending,
      icon: Clock,
      color: "bg-purple-500",
    },
  ];

  const statusData = Object.entries(a.status_counts || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const paymentData = Object.entries(a.revenue_by_payment || {}).map(
    ([name, amount]) => ({ name, amount })
  );

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-base-content/60 mt-1">
        Welcome back, {user?.name || "Restaurant Owner"}. Here's what's happening today.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((s) => (
          <div key={s.label} className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold mt-2">{s.value}</p>
              <p className="text-sm text-base-content/60">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Daily sales */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-2">Daily Sales</h2>
            {a.daily_sales.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={a.daily_sales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" name="Revenue (৳)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-base-content/50 py-14 text-center">No sales data yet.</p>
            )}
          </div>
        </div>

        {/* Monthly sales */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-2">Monthly Sales</h2>
            {a.monthly_sales.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={a.monthly_sales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" name="Revenue (৳)" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-base-content/50 py-14 text-center">No monthly data yet.</p>
            )}
          </div>
        </div>

        {/* Popular foods */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Popular Foods</h2>
              <Link to="/restaurant/foods" className="btn btn-sm btn-outline">
                Manage foods
              </Link>
            </div>
            {a.popular_foods.length === 0 ? (
              <p className="text-base-content/50 py-14 text-center">
                No orders yet — popular foods will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {a.popular_foods.map((f) => {
                  const max = Math.max(...a.popular_foods.map((x) => x.orders));
                  return (
                    <div key={f.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{f.name}</span>
                        <span className="text-base-content/60">{f.orders} orders</span>
                      </div>
                      <progress
                        className="progress progress-primary w-full"
                        value={f.orders}
                        max={max || 1}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Order status */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-2">Order Status</h2>
            {statusData.length === 0 || statusData.every((d) => d.value === 0) ? (
              <p className="text-base-content/50 py-14 text-center">No orders yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.name}
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
      </div>

      {/* Revenue by payment (full width) */}
      <div className="card bg-base-100 shadow-md mt-6">
        <div className="card-body">
          <h2 className="text-xl font-bold mb-2">Revenue by Payment</h2>
          {paymentData.length === 0 ? (
            <p className="text-base-content/50 py-8 text-center">No payment data yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentData.map((p) => (
                <div key={p.name} className="rounded-xl bg-base-200/60 p-4">
                  <p className="text-sm text-base-content/60">{p.name}</p>
                  <p className="text-2xl font-bold mt-1">{p.amount} ৳</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;