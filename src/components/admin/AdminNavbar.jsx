import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  RefreshCw,
  Check,
  CheckCheck,
  ChevronDown,
  UserRound,
  User,
  Store,
  Bike,
  Settings,
  LogOut,
  ArrowRight,
  ShoppingBag,
  PackageCheck,
  Utensils,
  Star,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../../services/adminService";
import { Avatar } from "./SmartImage";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

const TITLES = {
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/restaurants": "Restaurants",
  "/admin/riders": "Riders",
  "/admin/riders/requests": "Rider Requests",
  "/admin/foods": "Foods",
  "/admin/categories": "Categories",
  "/admin/reviews": "Reviews",
  "/admin/payments": "Payments",
  "/admin/reports": "Reports",
  "/admin/analytics": "Analytics",
  "/admin/notifications": "Notifications",
  "/admin/settings": "Settings",
  "/admin/dashboard": "Dashboard",
};

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
  return t.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const useClickOutside = (ref, onOutside) => {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
};

const AdminNavbar = ({ onToggleSidebar, search, onSearch }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const loadNotifications = useCallback(async (showSpinner) => {
    if (showSpinner) setNotifLoading(true);
    try {
      const { notifications: list, unread_count } = await fetchAdminNotifications(15);
      setNotifications(list);
      setUnreadCount(unread_count);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Initial load + refresh whenever notifications are opened.
  useEffect(() => {
    loadNotifications(false);
  }, [loadNotifications, notifOpen]);

  const handleRefresh = () => loadNotifications(true);

  const openNotification = async (n) => {
    if (n && !n.isRead) {
      setNotifications((list) =>
        list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markAdminNotificationRead(n._id).catch(() => {});
    }
    setNotifOpen(false);
    navigate(n.navigateTo || "/admin");
  };

  const handleMarkRead = async (e, n) => {
    e.stopPropagation();
    if (n.isRead) return;
    setNotifications((list) =>
      list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markAdminNotificationRead(n._id);
      loadNotifications(false);
    } catch {
      // Keep the optimistic UI even if the server call failed.
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((list) => list.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllAdminNotificationsRead();
      loadNotifications(false);
    } catch {
      // Keep the optimistic UI even if the server call failed.
    }
  };

  const title =
    TITLES[pathname] || (pathname.startsWith("/admin") ? "Admin Panel" : "Dashboard");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-base-300 bg-base-100/80 px-4 sm:px-6 backdrop-blur">
      <button
        onClick={onToggleSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-base-300 bg-base-100 text-base-content/60 hover:bg-base-200 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-bold tracking-tight text-base-content">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/60 transition-colors hover:bg-base-200" />

        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
          <input
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Search users, restaurants, orders..."
            className="h-10 w-64 rounded-xl border border-base-300 bg-base-200 pl-9 pr-3 text-sm text-base-content outline-none transition-colors placeholder:text-base-content/50 focus:border-primary focus:bg-base-100 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 transition-colors hover:bg-base-200 ${
              notifOpen ? "bg-base-200 text-base-content" : "bg-base-100 text-base-content/60"
            }`}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-error-content">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[min(90vw,22rem)] overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-base-200 px-4 py-3">
                <p className="text-sm font-bold text-base-content">Notifications</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleRefresh}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content"
                    aria-label="Refresh notifications"
                    title="Refresh"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${notifLoading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0}
                    className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content disabled:cursor-not-allowed disabled:opacity-40"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Read all
                  </button>
                </div>
              </div>

              {/* Feed */}
              <div className="max-h-96 overflow-y-auto">
                {notifLoading && notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-base-content/50">
                    Loading notifications…
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell className="mx-auto mb-2 h-8 w-8 text-base-content/30" />
                    <p className="text-sm text-base-content/50">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = TYPE_ICONS[n.type] || Bell;
                    const tint = TYPE_TINTS[n.type] || "bg-base-200 text-base-content/60";
                    const RoleIcon = ROLE_META[n.role]?.icon;
                    return (
                      <button
                        key={n._id}
                        onClick={() => openNotification(n)}
                        className={`group flex w-full items-start gap-3 border-b border-base-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-base-200/70 ${
                          !n.isRead ? "bg-primary/5" : ""
                        }`}
                      >
                        <span
                          className={`relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tint}`}
                        >
                          <Icon className="h-4 w-4" />
                          {!n.isRead && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-error ring-2 ring-base-100" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-base-content">
                            {n.title || "Notification"}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-base-content/60 line-clamp-2">
                            {n.message}
                          </span>
                          <span className="mt-1 flex items-center gap-2 text-[11px] text-base-content/40">
                            {RoleIcon && <RoleIcon className="h-3 w-3" />}
                            {ROLE_META[n.role]?.label && <span>{ROLE_META[n.role].label}</span>}
                            <span>·</span>
                            <span>{timeAgo(n.createdAt)}</span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => handleMarkRead(e, n)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMarkRead(e, n);
                              }
                            }}
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                              n.isRead
                                ? "cursor-default text-base-content/30"
                                : "cursor-pointer text-primary hover:bg-primary/10"
                            }`}
                            title={n.isRead ? "Read" : "Mark as read"}
                            aria-label={n.isRead ? "Read" : "Mark as read"}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-base-content/30" />
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-base-200">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    navigate("/admin/notifications");
                  }}
                  className="flex w-full items-center justify-center gap-1 px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-base-200"
                >
                  View all notifications
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 py-1 pl-1 pr-2 transition-colors hover:bg-base-200"
          >
            <Avatar src={user?.avatar_url} name={user?.name || "Admin"} className="h-8 w-8" />
            <span className="hidden text-sm font-semibold text-base-content sm:block">
              {user?.name?.split(" ")[0] || "Admin"}
            </span>
            <ChevronDown className="h-4 w-4 text-base-content/50" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-base-300 bg-base-100 py-2 shadow-xl">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/admin/profile");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-base-content/70 hover:bg-base-200"
              >
                <UserRound className="h-4 w-4 text-base-content/50" /> My Profile
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/admin/settings");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-base-content/70 hover:bg-base-200"
              >
                <Settings className="h-4 w-4 text-base-content/50" /> Settings
              </button>
              <div className="my-1 border-t border-base-200" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;