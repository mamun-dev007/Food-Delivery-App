import { Link } from "react-router-dom";
import { Eye, ArrowRight } from "lucide-react";
import DashboardCard from "./DashboardCard";
import StatusBadge from "./StatusBadge";

function itemLabel(items) {
  if (!Array.isArray(items) || items.length === 0) return "—";
  const first = items[0];
  const totalQty = items.reduce((s, it) => s + Number(it.quantity || 1), 0);
  return `${first.name || "Item"} + ${totalQty}`;
}

function fmtTime(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const RecentOrders = ({ orders }) => (
  <DashboardCard
    title="Recent Orders"
    subtitle="Latest orders placed at your restaurant"
    className="lg:col-span-3"
    action={
      <Link
        to="/dashboard/orders"
        className="text-sm font-medium text-primary hover:text-primary"
      >
        View All Orders
      </Link>
    }
  >
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-base-200 text-xs uppercase tracking-wide text-base-content/50">
            <th className="px-2 py-3 font-medium">Order ID</th>
            <th className="px-2 py-3 font-medium">Customer</th>
            <th className="px-2 py-3 font-medium">Items</th>
            <th className="px-2 py-3 font-medium text-right">Total</th>
            <th className="px-2 py-3 font-medium">Status</th>
            <th className="px-2 py-3 font-medium">Time</th>
            <th className="px-2 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-200">
          {orders.map((o) => (
            <tr key={o.id || o.order_no} className="transition-colors hover:bg-base-200/60">
              <td className="px-2 py-3 font-semibold text-base-content">{o.order_no}</td>
              <td className="px-2 py-3 text-base-content/70">{o.customer}</td>
              <td className="px-2 py-3 text-base-content/60">{itemLabel(o.items)}</td>
              <td className="px-2 py-3 text-right font-semibold text-base-content">
                ৳{Number(o.total || 0).toFixed(2)}
              </td>
              <td className="px-2 py-3">
                <StatusBadge status={o.status} />
              </td>
              <td className="px-2 py-3 text-base-content/50">{fmtTime(o.date)}</td>
              <td className="px-2 py-3 text-right">
                <Link
                  to="/dashboard/orders"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-base-content/50 transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label={`View order ${o.order_no}`}
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-4 flex justify-end lg:hidden">
      <Link
        to="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary"
      >
        View All Orders <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </DashboardCard>
);

export default RecentOrders;