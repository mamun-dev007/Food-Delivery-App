import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ShoppingBag, Star, Bike, UserPlus, Bell as BellIcon } from "lucide-react";

const TYPE_ICONS = {
  order: ShoppingBag,
  review: Star,
  delivered: CheckCheck,
  progress: Bike,
  customer: UserPlus,
  info: BellIcon,
};

function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const NotificationDropdown = ({ notifications, unreadCount, onReadAll, onReadOne }) => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(() => Number(unreadCount) || 0);
  const ref = useRef(null);

  useEffect(() => {
    setUnread(Number(unreadCount) || 0);
  }, [unreadCount]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const list = Array.isArray(notifications) ? notifications.slice(0, 6) : [];

  // Clicking a specific notification marks THAT one (and older) as read
  // via the backend — the badge persists cleared across refresh.
  const handleItemClick = (n) => {
    if (!n.read && typeof onReadOne === "function" && n.time) {
      onReadOne(n.time);
    }
  };

  const handleMarkAllRead = () => {
    setUnread(0);
    if (typeof onReadAll === "function") onReadAll();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-content">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl max-sm:fixed max-sm:inset-x-3 max-sm:top-14 max-sm:w-auto max-sm:max-w-none">
          <div className="flex items-center justify-between border-b border-base-200 px-4 py-3">
            <p className="text-sm font-semibold text-base-content">Notifications</p>
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-primary hover:text-primary"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {list.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-base-content/50">
                No new notifications
              </div>
            ) : (
              list.map((n, i) => {
                const Icon = TYPE_ICONS[n.type] || BellIcon;
                return (
                  <button
                    key={n.id || i}
                    onClick={() => handleItemClick(n)}
                    className="flex w-full gap-3 border-b border-base-200 px-4 py-3 text-left last:border-0 hover:bg-base-200/60"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-base-content">
                        {n.title || "Update"}
                      </span>
                      <span className="block truncate text-xs text-base-content/60">
                        {n.message}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-base-content/50">
                        <CheckCheck className="h-3 w-3" />
                        {relTime(n.time)}
                      </span>
                    </span>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;