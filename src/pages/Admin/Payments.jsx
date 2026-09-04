import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { RefreshCw, Wallet, Receipt } from "lucide-react";
import { fetchAdminPayments } from "../../services/adminService";
import StatusBadge from "../../components/admin/StatusBadge";
import { StatGridSkeleton, TableSkeleton } from "../../components/dashboard/Skeleton";

const fmtMoney = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const Payments = () => {
  const { search = "" } = useOutletContext() || {};
  const [payments, setPayments] = useState({ total_received: 0, methods: [], recent: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminPayments();
      setPayments(data);
    } catch (err) {
      toast.error(err?.message || "Could not load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reload = () => load();

  const q = search.trim().toLowerCase();
  const filtered = (payments.recent || []).filter((t) =>
    [t.order_no, t.customer, t.method].some((v) => v?.toLowerCase().includes(q))
  );

  const maxTotal = Math.max(1, ...(payments.methods || []).map((m) => m.total || 0));

  if (loading)
    return (
      <div className="space-y-4">
        <StatGridSkeleton count={2} />
        <TableSkeleton rows={8} cols={5} />
      </div>
    );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">Payments</h1>
          <p className="mt-0.5 text-sm text-base-content/50">Total received and recent transactions</p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-primary p-4 text-primary-content">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary-content" />
            <p className="text-xs text-primary-content/70">Total received</p>
          </div>
          <p className="mt-1 text-3xl font-bold tracking-tight text-primary-content">
            {fmtMoney(payments.total_received)}
          </p>
        </div>
        <div className="rounded-xl bg-base-200 p-4 bg-primary">
          <p className="text-2xl font-bold text-base-content">{(payments.methods || []).length}</p>
          <p className="text-xs text-base-content/50">Payment methods</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-base-content">Payment Methods</h3>
        </div>
        {payments.methods?.length === 0 && (
          <p className="py-10 text-center text-sm text-base-content/50">No payment methods yet</p>
        )}
        {payments.methods?.length > 0 && (
          <div className="mt-4 space-y-4">
            {payments.methods.map((m) => (
              <div key={m.method || m._id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-base-content">{m.method}</span>
                  <span className="text-xs text-base-content/50">
                    {fmtMoney(m.total)} · {m.count} transaction{m.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-base-200">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(m.total / maxTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-base-content">Recent Transactions</h3>
        </div>
        <div className="w-full min-w-[820px] overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
                <th className="pb-2 font-semibold">Order#</th>
                <th className="pb-2 font-semibold">Customer</th>
                <th className="pb-2 font-semibold">Restaurant</th>
                <th className="pb-2 font-semibold">Method</th>
                <th className="pb-2 font-semibold">Commission</th>
                <th className="pb-2 font-semibold">Restaurant Payout</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <p className="py-10 text-center text-sm text-base-content/50">No transactions yet</p>
                  </td>
                </tr>
              )}
              {filtered.map((t, i) => (
                <tr key={t.id || t.order_no || i} className="border-b border-base-100">
                  <td className="py-2.5 font-medium text-base-content">#{t.order_no}</td>
                  <td className="py-2.5 text-base-content/70">{t.customer || "—"}</td>
                  <td className="py-2.5 text-base-content/70">{t.restaurant || "—"}</td>
                  <td className="py-2.5 text-base-content/70">{t.method || "—"}</td>
                  <td className="py-2.5 font-semibold text-base-content">{fmtMoney(t.amount)}</td>
                  <td className="py-2.5 text-base-content/70">{fmtMoney(t.restaurant_payout)}</td>
                  <td className="py-2.5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-2.5 text-base-content/70">
                    {t.date ? new Date(t.date).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;