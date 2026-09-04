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
import { Loader2 } from "lucide-react";
import { fetchOwnerOrders } from "../../../services/restaurantService";

function fmtDay(iso) {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const Sales = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await fetchOwnerOrders());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const delivered = orders.filter((o) => o.status === "Delivered");
  const cancelled = orders.filter((o) => o.status === "Cancelled");
  const revenue = delivered.reduce(
    (s, o) => s + Number(o.restaurant_payout ?? o.total ?? 0),
    0
  );
  const commission = delivered.reduce(
    (s, o) => s + Number(o.admin_commission ?? 0),
    0
  );
  const avgOrder = delivered.length ? revenue / delivered.length : 0;

  // Group revenue by day (real order date).
  const byDate = {};
  delivered.forEach((o) => {
    const day = fmtDay(o.date);
    byDate[day] = (byDate[day] || 0) + Number(o.restaurant_payout ?? o.total ?? 0);
  });
  const chartData = Object.entries(byDate)
    .map(([date, amount]) => ({ date, amount: parseFloat(amount.toFixed(2)) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group revenue by payment method.
  const byPayment = {};
  delivered.forEach((o) => {
    const method = o.payment || "Cash on Delivery";
    byPayment[method] = (byPayment[method] || 0) + Number(o.restaurant_payout ?? o.total ?? 0);
  });
  const maxPayment = Math.max(0, ...Object.values(byPayment));

  const stats = [
    { label: "Net Revenue (95%)", value: `$${revenue.toFixed(2)}` },
    { label: "Admin Commission (5%)", value: `$${commission.toFixed(2)}` },
    { label: "Delivered Orders", value: delivered.length },
    { label: "Avg Order Value", value: `$${avgOrder.toFixed(2)}` },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-base-content/60 mt-1">
          Net revenue by day — you keep 95% of every delivered subtotal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card bg-base-100 shadow-md">
            <div className="card-body">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-base-content/60">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16 text-base-content/50 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading sales data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2 card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="text-xl font-bold mb-4">Revenue by Day</h2>
                {chartData.length === 0 ? (
                  <p className="text-base-content/50 py-16 text-center">
                    No sales data yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" name="Net Revenue ($)" fill="#2563eb" radius={[4, 4, 0, 0]} />
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
                          <span className="font-semibold">${amount.toFixed(2)}</span>
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
        </>
      )}
    </div>
  );
};

export default Sales;
