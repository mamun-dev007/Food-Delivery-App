import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchCustomerNotifications,
  markNotificationsRead,
} from "../../../services/customerService";
import { notificationIcon } from "../../../components/customer/notificationIcons";
import CustomerEmptyState from "../../../components/customer/EmptyState";
import { timeAgo } from "../../../components/rider/shared";

const Notifications = () => {
  const { refreshNotifications, markOneRead } = useOutletContext() || {};
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerNotifications();
      setNotifications(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch {
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
      refreshNotifications?.();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Could not update notifications.");
    }
  };

  // Clicking a specific notification marks THAT one (and older) as read —
  // persisted on the backend so it stays read after a refresh.
  const markOneAsRead = async (n) => {
    if (n.read || !n.time) return;
    try {
      const mark = markOneRead || markNotificationsRead;
      await mark(n.time);
      await load();
      refreshNotifications?.();
    } catch {
      toast.error("Could not update notification.");
    }
  };

  return (
    <div className="mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">Notifications</h1>
          <p className="text-sm text-base-content/50">
            {unread > 0
              ? `${unread} unread notification${unread > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold text-base-content transition-colors hover:bg-base-200"
          >
            <CheckCheck className="h-4 w-4 text-primary" /> Mark all as read
          </button>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-base-300 bg-base-200/60" />
          ))
        ) : notifications.length === 0 ? (
          <CustomerEmptyState
            icon={Bell}
            title="No notifications yet"
            message="Order status updates, deliveries and promotions will appear here."
            action={
              <Link
                to="/menu"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content"
              >
                Browse Menu
              </Link>
            }
          />
        ) : (
          notifications.map((n, i) => {
            const { icon: Icon, tint } = notificationIcon(n.type);
            return (
              <div
                key={`${n.title}-${i}`}
                onClick={() => markOneAsRead(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    markOneAsRead(n);
                  }
                }}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                  n.read
                    ? "border-base-300 bg-base-100"
                    : "border-primary/30 bg-primary/5 hover:bg-primary/5"
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-base-content">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-base-content/60">{n.message}</p>
                  <p className="mt-1 text-[11px] text-base-content/40">{timeAgo(n.time)}</p>
                </div>
                {n.relatedId && (
                  <Link
                    to="/customer/dashboard/my-orders"
                    className="self-center text-xs font-bold text-primary hover:underline"
                  >
                    View order
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;