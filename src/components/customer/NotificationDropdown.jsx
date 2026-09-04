import { Bell } from "lucide-react";
import { timeAgo } from "../rider/shared";
import { notificationIcon } from "./notificationIcons";

const CustomerNotificationDropdown = ({ items = [], onOpenAll, onReadOne }) => (
  <div className="absolute right-0 top-full z-50 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl">
    <div className="flex items-center justify-between border-b border-base-300 bg-base-200/50 px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-bold text-base-content">
        <Bell className="h-4 w-4 text-primary" /> Notifications
      </p>
      {items.some((n) => !n.read) && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
          {items.filter((n) => !n.read).length} unread
        </span>
      )}
    </div>

    <div className="max-h-80 overflow-y-auto">
      {items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-base-content/40">
          No notifications yet.
        </p>
      ) : (
        items.slice(0, 8).map((n, i) => {
          const { icon: Icon, tint } = notificationIcon(n.type);
          return (
            <button
              key={`${n.title}-${i}`}
              onClick={() => {
                // Clicking a specific notification marks THAT one as read
                // (persisted on the backend) before opening the full page.
                if (!n.read && typeof onReadOne === "function" && n.time) {
                  onReadOne(n.time);
                }
                onOpenAll?.();
              }}
              className="flex w-full items-start gap-3 border-b border-base-200 px-4 py-3 text-left transition-colors hover:bg-base-200/50 last:border-0"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-base-content">
                  {n.title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-base-content/60">
                  {n.message}
                </span>
                <span className="mt-1 block text-[11px] text-base-content/40">{timeAgo(n.time)}</span>
              </span>
              {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          );
        })
      )}
    </div>

    <button
      onClick={onOpenAll}
      className="block w-full border-t border-base-300 bg-base-200/50 px-4 py-2.5 text-center text-xs font-bold text-primary hover:bg-base-200"
    >
      View all notifications
    </button>
  </div>
);

export default CustomerNotificationDropdown;