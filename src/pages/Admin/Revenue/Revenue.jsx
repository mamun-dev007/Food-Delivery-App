import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAdminStats } from "../../../services/adminService";
import { StatGridSkeleton, ChartCardSkeleton } from "../../../components/dashboard/Skeleton";

function fmtMonth(key) {
  if (!key) return key;
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short" });
}

const RevenueDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await fetchAdminStats());
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalRevenue = stats?.total_revenue || 0;
  const monthly =
    stats?.monthly?.map((m) => ({
      ...m,
      month: fmtMonth(m.month),
    })) || [];
  const byPayment = stats?.revenue_by_payment || {};
  const maxPayment = Math.max(0, ...Object.values(byPayment));

  const avgMonthly = monthly.length
    ? totalRevenue / monthly.length
    : 0;

  const statCards = [
    { label: "Admin Commission", value: `$${Number(totalRevenue).toLocaleString()}` },
    { label: "Avg Monthly", value: `$${Math.round(avgMonthly).toLocaleString()}` },
    { label: "Platform Orders", value: stats?.total_orders ?? 0 },
    { label: "Completed Sub-orders", value: stats?.completed_orders ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Revenue Dashboard</h1>
      <p className="text-base-content/60 mt-1 mb-6">
        5% platform commission on every delivered restaurant order.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card bg-base-100 shadow-md">
            <div className="card-body">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-base-content/60">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <>
          <StatGridSkeleton />
          <ChartCardSkeleton className="lg:col-span-2" />
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="text-xl font-bold mb-4">Monthly Revenue</h2>
              {monthly.length === 0 ? (
                <p className="text-base-content/50 py-16 text-center">
                  No sales data yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" name="Commission ($)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" name="Orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="text-xl font-bold mb-4">Revenue by Payment</h2>
              {Object.keys(byPayment).length === 0 ? (
                <p className="text-base-content/50 py-16 text-center">
                  No data yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(byPayment).map(([method, amount]) => (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{method}</span>
                        <span className="font-semibold">${Number(amount).toFixed(2)}</span>
                      </div>
                      <progress
                        className="progress progress-primary w-full"
                        value={amount}
                        max={maxPayment || 1}
                      ></progress>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueDashboard;
