import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Store, ArrowRight, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { approveRestaurantRequest, rejectRestaurantRequest } from "../../services/adminService";
import { Avatar } from "./SmartImage";
import StatusBadge from "./StatusBadge";

const RestaurantApprovals = ({ requests = [], className = "" }) => {
  const [open, setOpen] = useState(() => requests.map(() => false));

  const approve = async (id) => {
    try {
      await approveRestaurantRequest(id);
      toast.success("Restaurant approved.");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err?.message || "Action failed.");
    }
  };

  const reject = async (id) => {
    try {
      await rejectRestaurantRequest(id);
      toast.success("Restaurant rejected.");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err?.message || "Action failed.");
    }
  };

  return (
    <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-base-content">Restaurant Approvals</h3>
        </div>
        <Link
          to="/admin/restaurants/requests"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {requests.length === 0 && (
          <p className="py-6 text-center text-sm text-base-content/50">No requests pending review</p>
        )}
        {requests.slice(0, 4).map((r, i) => (
          <div key={r.id} className="rounded-xl border border-base-300 p-3">
            <div className="flex items-center gap-3">
              <Avatar src={r.avatar_url} name={r.name} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-base-content">{r.name}</p>
                <p className="truncate text-xs text-base-content/50">
                  {r.restaurant?.name || "Restaurant"} · {r.restaurant?.cuisine || "—"}
                </p>
              </div>
              <StatusBadge status={r.status === "rejected" ? "rejected" : "pending"} />
              <button
                onClick={() => setOpen((o) => o.map((v, j) => (j === i ? !v : v)))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-base-content/50 hover:bg-base-200"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
            {open[i] && (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-base-content/60">
                <p>City: {r.restaurant?.city || "—"}</p>
                <p>Phone: {r.restaurant?.phone || r.phone || "—"}</p>
                <p>Address: {r.restaurant?.address || "—"}</p>
                <p>Trade license: {r.restaurant?.trade_license || "—"}</p>
              </div>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => reject(r.id)}
                className="flex items-center gap-1 rounded-lg border border-base-300 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
              <button
                onClick={() => approve(r.id)}
                className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-content shadow-md shadow-primary/30 hover:bg-primary"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantApprovals;