import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bell, CheckCheck } from "lucide-react";
import { fetchRiderNotifications, markNotificationsRead } from "../../../services/riderService";
import { notificationIcon } from "../../../components/rider/NotificationDropdown";
import EmptyState from "../../../components/rider/EmptyState";
import { timeAgo } from "../../../components/rider/shared";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRiderNotifications();
      setNotifications(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load notifications.");
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
      toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not update notifications.");
    }
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-base-content">Notifications</h2>
          <p className="text-sm text-base-content/50">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "All caught up"}
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
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            message="Order updates, earnings and announcements will appear here."
          />
        ) : (
          notifications.map((n, i) => {
            const { icon: Icon, tint } = notificationIcon(n.type);
            return (
              <div
                key={`${n.title}-${i}`}
                className={`flex items-start gap-3 rounded-2xl border p-4 shadow-sm ${
                  n.read ? "border-base-300 bg-base-100" : "border-primary/30 bg-primary/5"
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;