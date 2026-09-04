import { Link } from "react-router-dom";
import { ClipboardList, ArrowRight } from "lucide-react";
import StatusBadge from "./StatusBadge";

const fmtMoney = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const RecentOrdersTable = ({ orders = [], className = "" }) => (
  <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-base-content">Recent Orders</h3>
      </div>
      <Link
        to="/admin/orders"
        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary"
      >
        View all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>

    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
            <th className="pb-2 font-semibold">Order</th>
            <th className="pb-2 font-semibold">Customer</th>
            <th className="pb-2 font-semibold">Restaurant</th>
            <th className="pb-2 font-semibold">Total</th>
            <th className="pb-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-base-content/50">
                No orders yet
              </td>
            </tr>
          )}
          {orders.slice(0, 8).map((o, i) => (
            <tr key={o._id || i} className="border-b border-base-100">
              <td className="py-2.5 font-medium text-base-content">#{o.order_no || o._id}</td>
              <td className="py-2.5 text-base-content/70">
                {o.delivery?.name || "—"}
              </td>
              <td className="max-w-[160px] truncate py-2.5 text-base-content/70">{o.restaurant_name || "—"}</td>
              <td className="py-2.5 font-semibold text-base-content">{fmtMoney(o.total_amount)}</td>
              <td className="py-2.5">
                <StatusBadge status={o.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default RecentOrdersTable;