import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Menu, Moon, ShoppingCart, Sun } from "lucide-react";
import { Avatar } from "../admin/SmartImage";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useThemeStore } from "../../store/themeStore";
import { greetingByHour } from "../rider/shared";
import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";

const CustomerNavbar = ({
  title,
  notifications = [],
  unreadCount = 0,
  onOpenSidebar,
  onNotificationRead,
}) => {
  const user = useAuthStore((s) => s.user);
  const cartItems = useCartStore((s) => s.items);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null); // "bell" | "profile" | null
  const rootRef = useRef(null);
  const cartCount = cartItems.reduce((s, i) => s + (i.qty || 1), 0);

  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const firstName = (user?.name || "Foodie").trim().split(" ")[0];

  return (
    <header className="sticky top-0 z-40 border-b border-base-300/60 bg-base-100/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
        <button
          onClick={onOpenSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/60 transition-colors hover:bg-base-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Left: title */}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-base-content lg:text-xl">
            {title}
          </h1>
        </div>

        {/* Center: greeting (desktop only) */}
        <div className="mx-auto hidden flex-col items-center text-center md:flex">
          <p className="text-sm font-semibold text-base-content/90">
            {greetingByHour()}, {firstName}!
          </p>
          <p className="text-xs text-base-content/40">Have a great day and enjoy your meal!</p>
        </div>

        {/* Right side */}
        <div ref={rootRef} className="ml-auto flex items-center gap-2">
          {/* Cart */}
          <button
            onClick={() => navigate("/customer/cart")}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/60 transition-colors hover:bg-base-200"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-content ring-2 ring-base-100">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/60 transition-colors hover:bg-base-200"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === "bell" ? null : "bell");
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/60 transition-colors hover:bg-base-200"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-error-content ring-2 ring-base-100">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {openMenu === "bell" && (
              <div className="z-50 max-sm:fixed max-sm:inset-x-3 max-sm:top-14 sm:absolute sm:right-0 sm:top-full sm:max-w-[calc(100vw-1rem)]">
                <NotificationDropdown
                  items={notifications}
                  onReadOne={onNotificationRead}
                  onOpenAll={() => {
                    setOpenMenu(null);
                    navigate("/customer/dashboard/notifications");
                  }}
                />
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === "profile" ? null : "profile");
              }}
              className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-base-200"
              aria-label="Profile menu"
            >
              <Avatar src={user?.avatar_url} name={user?.name || "C"} className="h-8 w-8" />
              <span className="hidden text-left md:block">
                <span className="block max-w-[120px] truncate text-xs font-bold text-base-content/90">
                  {user?.name || "Customer"}
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-wide text-base-content/40">
                  Customer
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-base-content/40" />
            </button>
            {openMenu === "profile" && <ProfileDropdown onClose={() => setOpenMenu(null)} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CustomerNavbar;