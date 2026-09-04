import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { fetchAdminOrders } from "../../../services/adminService";
import {
  TableSkeleton,
  StatGridSkeleton,
} from "../../../components/dashboard/Skeleton";
import StatusBadge from "../../../components/admin/StatusBadge";

const fmtMoney = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { search = "" } = useOutletContext() || {};

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await fetchAdminOrders());
    } catch (err) {
      toast.error(err?.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const visible = orders.filter((o) => {
    if (!q) return true;
    return (
      (o.order_no || "").toLowerCase().includes(q) ||
      (o.customer || "").toLowerCase().includes(q) ||
      (o.restaurant_name || "").toLowerCase().includes(q)
    );
  });

  const stats = [
    {
      label: "Pending",
      value: orders.filter((o) => o.status === "Pending").length,
    },
    {
      label: "Active",
      value: orders.filter(
        (o) => o.status === "Preparing" || o.status === "On the Way"
      ).length,
    },
    {
      label: "Delivered",
      value: orders.filter((o) => o.status === "Delivered").length,
    },
    {
      label: "Cancelled",
      value: orders.filter((o) => o.status === "Cancelled").length,
    },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">
            Orders
          </h1>
          <p className="mt-0.5 text-sm text-base-content/50">
            Monitor and manage all orders across the platform.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <>
          <StatGridSkeleton count={4} />
          <div className="mt-5">
            <TableSkeleton rows={8} cols={6} />
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-base-200 p-4">
                <p className="text-2xl font-bold text-base-content">{s.value}</p>
                <p className="text-xs text-base-content/50">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            {visible.length === 0 ? (
              <p className="py-10 text-center text-sm text-base-content/50">
                No orders yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
                      <th className="pb-2 font-semibold">Order</th>
                      <th className="pb-2 font-semibold">Customer</th>
                      <th className="pb-2 font-semibold">Restaurant</th>
                      <th className="pb-2 font-semibold">Payment</th>
                      <th className="pb-2 font-semibold">Total</th>
                      <th className="pb-2 font-semibold">Status</th>
                      <th className="pb-2 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((o) => (
                      <tr
                        key={o.id || o.order_id}
                        className="border-b border-base-100"
                      >
                        <td className="py-2.5 font-medium text-base-content">
                          #{o.order_no || o.order_id}
                        </td>
                        <td className="py-2.5 text-base-content/70">
                          <p className="font-medium text-base-content">
                            {o.customer || "—"}
                          </p>
                          {o.phone && (
                            <p className="text-xs text-base-content/50">{o.phone}</p>
                          )}
                        </td>
                        <td className="py-2.5 text-base-content/70">
                          {o.restaurant_name || "—"}
                        </td>
                        <td className="py-2.5 text-base-content/70">
                          {o.payment || "—"}
                        </td>
                        <td className="py-2.5 font-semibold text-base-content">
                          {fmtMoney(o.total)}
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="py-2.5 text-base-content/70">
                          {o.date
                            ? new Date(o.date).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;