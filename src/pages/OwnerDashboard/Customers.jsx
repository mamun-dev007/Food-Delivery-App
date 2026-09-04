import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import PageHeader from "../../components/dashboard/PageHeader";
import EmptyState from "../../components/dashboard/EmptyState";
import { TableSkeleton } from "../../components/dashboard/Skeleton";
import { fetchOwnerOrders } from "../../services/restaurantService";
import { useDashboardRange } from "../../components/dashboard/DashboardLayout";
import DateRangePicker from "../../components/dashboard/DateRangePicker";

function initials(name) {
  return (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-info/10 text-info",
  "bg-secondary/10 text-secondary",
];

const CustomersPage = () => {
  const [customers, setCustomers] = useState(null);
  const { range, setRange } = useDashboardRange();

  const load = useCallback(async () => {
    try {
      const orders = await fetchOwnerOrders();
      const map = new Map();
      for (const o of orders) {
        const name = o.customer;
        if (!name) continue;
        const cur = map.get(name) || { name, orders: 0, spent: 0, lastOrder: o.date };
        cur.orders += 1;
        cur.spent += Number(o.total || 0);
        map.set(name, cur);
      }
      const derived = [...map.values()].sort((a, b) => b.orders - a.orders);
      setCustomers(derived);
    } catch {
      toast.error("Could not load customers.");
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalSpent = (customers || []).reduce((s, c) => s + Number(c.spent || 0), 0);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="The people who order from your restaurant."
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      {!customers ? (
        <div className="mt-6">
          <TableSkeleton rows={8} cols={4} />
        </div>
      ) : customers.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No customers yet" message="Customers will appear once they place orders." />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
              <p className="text-2xl font-bold text-base-content">{customers.length}</p>
              <p className="text-sm text-base-content/60">Total Customers</p>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
              <p className="text-2xl font-bold text-base-content">
                ৳{totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-base-content/60">Total Spending</p>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
              <p className="text-2xl font-bold text-base-content">
                {Math.max(0, (customers || []).reduce((s, c) => s + c.orders, 0))}
              </p>
              <p className="text-sm text-base-content/60">Total Orders</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-base-200 text-xs uppercase tracking-wide text-base-content/50">
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium text-right">Orders</th>
                    <th className="px-4 py-3 font-medium text-right">Total Spent</th>
                    <th className="px-4 py-3 font-medium">Last Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {customers.map((c, i) => (
                    <tr key={c.name} className="transition-colors hover:bg-base-200/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                          >
                            {initials(c.name)}
                          </span>
                          <span className="font-semibold text-base-content">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-base-content/70">{c.orders}</td>
                      <td className="px-4 py-3 text-right font-semibold text-base-content">
                        ৳{Number(c.spent || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-base-content/50">
                        {c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomersPage;