import { Link } from "react-router-dom";
import {
  BellRing,
  ArrowRight,
  ShoppingBag,
  Bike,
  Store,
  User,
  Utensils,
  Star,
  Info,
} from "lucide-react";

const TYPE_ICON = {
  order: ShoppingBag,
  delivery: Bike,
  restaurant: Store,
  customer: User,
  rider: Bike,
  food: Utensils,
  review: Star,
  system: Info,
};

const TYPE_COLOR = {
  order: "bg-sky-500",
  delivery: "bg-emerald-500",
  restaurant: "bg-violet-500",
  customer: "bg-blue-500",
  rider: "bg-teal-500",
  food: "bg-amber-500",
  review: "bg-pink-500",
  stock: "bg-amber-500",
  system: "bg-slate-400",
};

// Render the real MongoDB admin notification feed (title + message + actor).
const RecentActivity = ({ notifications = [], className = "" }) => (
  <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <BellRing className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-base-content">Recent Activity</h3>
      </div>
      <Link
        to="/admin/notifications"
        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary"
      >
        View all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>

    <div className="mt-4 space-y-1">
      {notifications.length === 0 && (
        <p className="py-6 text-center text-sm text-base-content/50">
          No activity yet — orders, deliveries and reviews will appear here.
        </p>
      )}
      {notifications.slice(0, 6).map((n, i) => {
        const Icon = TYPE_ICON[n.type] || Info;
        const color = TYPE_COLOR[n.type] || "bg-slate-400";
        return (
          <div key={n.id || n._id || i} className="flex items-start gap-3 py-2">
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color} text-white`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-base-content">{n.title || "Activity"}</p>
              {n.message && (
                <p className="text-xs text-base-content/60">{n.message}</p>
              )}
              <p className="text-[11px] text-base-content/40">
                {n.userName ? `${n.userName} · ` : ""}
                {n.created_at
                  ? new Date(n.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default RecentActivity;