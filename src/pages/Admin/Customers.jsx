import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { RefreshCw, Users, UserCheck, UserX } from "lucide-react";
import { fetchAdminUsers } from "../../services/adminService";
import StatusBadge from "../../components/admin/StatusBadge";
import { Avatar } from "../../components/admin/SmartImage";
import { TableSkeleton } from "../../components/dashboard/Skeleton";

const fmtMoney = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const Customers = () => {
  const { search = "" } = useOutletContext() || {};
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setCustomers(data);
    } catch (err) {
      toast.error(err?.message || "Could not load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reload = () => load();

  const q = search.trim().toLowerCase();
  const filtered = customers.filter((c) =>
    [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(q))
  );

  const active = customers.filter((c) => c.status === "active").length;
  const inactive = customers.length - active;

  if (loading) return <TableSkeleton rows={8} cols={5} />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">Customers</h1>
          <p className="mt-0.5 text-sm text-base-content/50">All registered customer accounts</p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-base-200 p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-base-content/50" />
            <p className="text-2xl font-bold text-base-content">{customers.length}</p>
          </div>
          <p className="text-xs text-base-content/50">Total customers</p>
        </div>
        <div className="rounded-xl bg-base-200 p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-500" />
            <p className="text-2xl font-bold text-base-content">{active}</p>
          </div>
          <p className="text-xs text-base-content/50">Active</p>
        </div>
        <div className="rounded-xl bg-base-200 p-4">
          <div className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-rose-500" />
            <p className="text-2xl font-bold text-base-content">{inactive}</p>
          </div>
          <p className="text-xs text-base-content/50">Inactive</p>
        </div>
      </div>

      <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
                <th className="pb-2 font-semibold">Customer</th>
                <th className="pb-2 font-semibold">Email</th>
                <th className="pb-2 font-semibold">Phone</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <p className="py-10 text-center text-sm text-base-content/50">No customers yet</p>
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id || c._id} className="border-b border-base-100">
                  <td className="py-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar src={c.avatar_url} name={c.name} className="h-9 w-9" />
                      <p className="font-medium text-base-content">{c.name}</p>
                    </div>
                  </td>
                  <td className="py-2.5 text-base-content/70">{c.email || "—"}</td>
                  <td className="py-2.5 text-base-content/70">{c.phone || "—"}</td>
                  <td className="py-2.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-2.5 text-base-content/70">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
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

export default Customers;