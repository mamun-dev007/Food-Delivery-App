import { useEffect, useState } from "react";
import { TrendingUp, Wallet, Receipt } from "lucide-react";
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
import { fetchOwnerEarnings } from "../../../services/restaurantService";
import { StatGridSkeleton, ChartCardSkeleton } from "../../../components/dashboard/Skeleton";

const Earnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchOwnerEarnings()
      .then((e) => {
        if (active) setEarnings(e);
      })
      .catch(() => {
        if (active) setEarnings(null);
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

  const e = earnings || {
    gross: 0,
    subtotal: 0,
    commission: 0,
    commission_rate: 5,
    delivery_fees: 0,
    discounts: 0,
    net: 0,
    total_orders: 0,
    avg_order: 0,
    avg_net: 0,
    top_items: [],
    history: [],
  };

  const breakdown = [
    { name: "Gross Revenue", amount: e.subtotal, color: "#2563eb" },
    { name: "Delivery Fees", amount: e.delivery_fees, color: "#94a3b8" },
    { name: "Net Earnings", amount: e.net, color: "#059669" },
  ];

  const cards = [
    {
      label: "Gross Revenue",
      value: `${e.subtotal} ৳`,
      icon: TrendingUp,
      color: "bg-blue-500",
    },
    {
      label: "Net Earnings (95%)",
      value: `${e.net} ৳`,
      icon: Wallet,
      color: "bg-green-500",
    },
    {
      label: "Admin Commission (5%)",
      value: `${e.commission} ৳`,
      icon: Receipt,
      color: "bg-orange-500",
    },
    {
      label: "Orders Delivered",
      value: e.total_orders,
      icon: Receipt,
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold">Earnings</h1>
      <p className="text-base-content/60 mt-1">
        You keep 95% of your delivered subtotal; 5% goes to the platform.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {cards.map((c) => (
          <div key={c.label} className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold mt-2">{c.value}</p>
              <p className="text-sm text-base-content/60">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-2">Revenue Breakdown</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" name="Amount (৳)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-2">Fee Summary</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-base-content/60">Subtotal (food sales)</dt>
                <dd className="font-semibold">{e.subtotal} ৳</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-base-content/60">Admin commission ({e.commission_rate}%)</dt>
                <dd className="font-semibold">-{e.commission} ৳</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-base-content/60">Delivery fees (paid by customer)</dt>
                <dd className="font-semibold">{e.delivery_fees} ৳</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-base-content/60">Discounts given</dt>
                <dd className="font-semibold">{e.discounts} ৳</dd>
              </div>
              <div className="divider my-1" />
              <div className="flex justify-between font-bold text-lg">
                <dt>Net Earnings (your payout)</dt>
                <dd className="text-primary">{e.net} ৳</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md mt-6">
        <div className="card-body">
          <h2 className="text-xl font-bold mb-2">Top Items by Revenue</h2>
          {e.top_items.length === 0 ? (
            <p className="text-base-content/50 py-8 text-center">
              No delivered items yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th className="text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {e.top_items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{item.name}</td>
                      <td className="text-right font-semibold">{item.amount} ৳</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    <div className="card bg-base-100 shadow-md mt-6">
        <div className="card-body">
          <h2 className="text-xl font-bold mb-2">Revenue History</h2>
          {e.history.length === 0 ? (
            <p className="text-base-content/50 py-8 text-center">
              No completed payouts yet — revenue appears once an order is delivered.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Subtotal</th>
                    <th className="text-right">Commission</th>
                    <th className="text-right">Payout</th>
                    <th className="text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {e.history.map((h, idx) => (
                    <tr key={h.subOrderId || idx}>
                      <td className="font-medium">#{h.orderNo}</td>
                      <td>{h.subtotal} ৳</td>
                      <td className="text-right">-{h.adminCommission} ৳</td>
                      <td className="text-right font-semibold">{h.restaurantPayout} ৳</td>
                      <td className="text-right text-base-content/60">
                        {h.completedAt
                          ? new Date(h.completedAt).toLocaleDateString()
                          : h.createdAt
                            ? new Date(h.createdAt).toLocaleDateString()
                            : "-"}
                      </td>
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

export default Earnings;