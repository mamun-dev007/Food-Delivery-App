import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAdminRiders,
  fetchRiderRequests,
} from "../../../services/adminService";
import { TableSkeleton } from "../../../components/dashboard/Skeleton";
import StatusBadge from "../../../components/admin/StatusBadge";
import { Avatar } from "../../../components/admin/SmartImage";

const Riders = () => {
  const [riders, setRiders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { search = "" } = useOutletContext() || {};

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ridersList, requestList] = await Promise.all([
        fetchAdminRiders(),
        fetchRiderRequests(),
      ]);
      setRiders(ridersList);
      setRequests(requestList);
    } catch (err) {
      toast.error(err?.message || "Could not load riders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const q = search.trim().toLowerCase();
  const visible = riders.filter((r) => {
    if (!q) return true;
    return (
      (r.name || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q) ||
      (r.vehicle_type || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">
            Riders
          </h1>
          <p className="mt-0.5 text-sm text-base-content/50">
            Manage delivery riders and their status.
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

      {pendingCount > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <span className="font-semibold">
            {pendingCount} rider request{pendingCount > 1 ? "s" : ""}
          </span>{" "}
          awaiting approval.{" "}
          <Link
            to="/admin/riders/requests"
            className="font-semibold text-primary hover:text-primary"
          >
            Review now
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-base-content/50">
            No riders yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
                  <th className="pb-2 font-semibold">Rider</th>
                  <th className="pb-2 font-semibold">Phone</th>
                  <th className="pb-2 font-semibold">Vehicle</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-b border-base-100">
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar src={r.avatar_url} name={r.name} className="h-10 w-10" />
                        <div>
                          <p className="font-medium text-base-content">{r.name}</p>
                          {r.email && (
                            <p className="text-xs text-base-content/50">{r.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-base-content/70">{r.phone || "—"}</td>
                    <td className="py-2.5 text-base-content/70">
                      {r.vehicle_type || "—"}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2.5 text-base-content/70">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Riders;