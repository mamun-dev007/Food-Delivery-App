import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import {
  RefreshCw,
  Bell,
  Check,
  CheckCheck,
  User,
  Store,
  Bike,
  ShoppingBag,
  PackageCheck,
  Utensils,
  Star,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../../services/adminService";
import { ListSkeleton } from "../../components/dashboard/Skeleton";

const ROLE_META = {
  customer: { icon: User, label: "Customer" },
  restaurantOwner: { icon: Store, label: "Restaurant Owner" },
  rider: { icon: Bike, label: "Rider" },
};

const TYPE_TINTS = {
  order: "bg-info/10 text-info",
  delivery: "bg-success/10 text-success",
  customer: "bg-primary/10 text-primary",
  restaurant: "bg-violet-500/10 text-violet-500",
  rider: "bg-emerald-500/10 text-emerald-500",
  food: "bg-amber-500/10 text-amber-500",
  review: "bg-cyan-500/10 text-cyan-500",
  complaint: "bg-error/10 text-error",
  stock: "bg-warning/10 text-warning",
};

const TYPE_ICONS = {
  order: ShoppingBag,
  delivery: PackageCheck,
  customer: User,
  restaurant: Store,
  rider: Bike,
  food: Utensils,
  review: Star,
  complaint: AlertTriangle,
  stock: AlertTriangle,
};

function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso);
  const diff = Date.now() - t.getTime();
  if (Number.isNaN(diff)) return "";
  const s = Math.floor(diff / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return t.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Notifications = () => {
  const { search = "" } = useOutletContext() || {};
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { notifications, unread_count } = await fetchAdminNotifications(100);
      setItems(notifications);
      setUnreadCount(unread_count);
    } catch (err) {
      toast.error(err?.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markOne = async (n) => {
    if (n.isRead) return;
    setItems((list) =>
      list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markAdminNotificationRead(n._id);
    } catch {
      load();
    }
  };

  const markAll = async () => {
    if (unreadCount === 0) return;
    setItems((list) => list.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllAdminNotificationsRead();
    } catch {
      load();
    }
  };

  const openNotification = (n) => navigate(n.navigateTo || "/admin");

  const q = search.trim().toLowerCase();
  const filtered = items.filter((n) =>
    [n.title, n.message, n.userName, ROLE_META[n.role]?.label].some((v) =>
      v?.toLowerCase().includes(q)
    )
  );

  if (loading) return <ListSkeleton rows={8} />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">Notifications</h1>
          <p className="mt-0.5 text-sm text-base-content/50">
            Recent platform activity feed
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-error px-2 py-0.5 text-xs font-bold text-error-content">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAll}
            disabled={unreadCount === 0}
            className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 transition-colors hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
          <button
            onClick={load}
            className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 transition-colors hover:bg-base-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-base-content">Activity</h3>
        </div>
        <div className="mt-2">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-base-content/50">No notifications yet</p>
          ) : (
            filtered.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              const tint = TYPE_TINTS[n.type] || "bg-base-200 text-base-content/60";
              const RoleIcon = ROLE_META[n.role]?.icon;
              return (
                <div
                  key={n._id}
                  onClick={() => openNotification(n)}
                  className={`group flex items-start gap-3 border-b border-base-100 px-1 py-3 last:border-b-0 md:cursor-pointer ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <span
                    className={`relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {!n.isRead && (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-error ring-2 ring-base-100" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-2">
                      <p className="truncate text-sm font-semibold text-base-content">
                        {n.title || "—"}
                      </p>
                      <span className="text-xs text-base-content/40">{timeAgo(n.createdAt)}</span>
                    </div>
                    {n.message && (
                      <p className="mt-0.5 text-sm text-base-content/60 line-clamp-2">{n.message}</p>
                    )}
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-base-content/40">
                      {RoleIcon && <RoleIcon className="h-3 w-3" />}
                      {ROLE_META[n.role]?.label && <span>{ROLE_META[n.role].label}</span>}
                      {n.userName && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-base-content/60">{n.userName}</span>
                        </>
                      )}
                      {n.relatedType && (
                        <>
                          <span>·</span>
                          <span className="capitalize">{n.relatedType}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {!n.isRead ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markOne(n);
                        }}
                        className="flex items-center gap-1 rounded-md border border-base-300 bg-base-100 px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        <Check className="h-3 w-3" /> Read
                      </button>
                    ) : (
                      <span className="px-2 py-1 text-[11px] text-base-content/30">Read</span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-base-content/30 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;