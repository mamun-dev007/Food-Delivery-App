import { useEffect, useRef, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Avatar } from "../admin/SmartImage";
import { useAuthStore } from "../../store/authStore";
import { greetingByHour } from "./shared";
import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

const RiderNavbar = ({
  title,
  isOnline,
  notifications = [],
  unreadCount = 0,
  onOpenSidebar,
}) => {
  const user = useAuthStore((s) => s.user);
  const [openMenu, setOpenMenu] = useState(null); // "bell" | "profile" | null
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/80 backdrop-blur">
      <div className="flex items-center gap-4 px-4 py-3 lg:px-8">
        <button
          onClick={onOpenSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/70 transition-colors hover:bg-base-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Left: title */}
        <div className="flex min-w-0 items-center">
          <h1 className="truncate text-lg font-bold tracking-tight text-base-content lg:text-xl">
            {title}
          </h1>
        </div>

        {/* Center: greeting (desktop only) */}
        <div className="mx-auto hidden text-center md:block">
          <p className="text-sm font-semibold text-base-content">
            {greetingByHour()}, {user?.name?.split(" ")[0] || "Rider"}! 👋
          </p>
          <p className="text-xs text-base-content/50">Stay safe and deliver happiness!</p>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2.5">
          <span
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold sm:inline-flex ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-base-200 text-base-content/50"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-base-content/40"}`} />
            {isOnline ? "Online" : "Offline"}
          </span>

          <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/70 transition-colors hover:bg-base-200" />

          {/* Notification bell */}
          <div className="relative" ref={ref}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === "bell" ? null : "bell");
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/70 transition-colors hover:bg-base-200"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-base-100">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {openMenu === "bell" && (
              <div className="z-50 max-sm:fixed max-sm:inset-x-3 max-sm:top-14 sm:absolute sm:left-auto sm:right-0 sm:max-w-[calc(100vw-1rem)]">
                <NotificationDropdown items={notifications} />
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === "profile" ? null : "profile");
              }}
              className="relative flex items-center"
              aria-label="Profile menu"
            >
              <Avatar src={user?.avatar_url} name={user?.name || "R"} className="h-10 w-10" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-base-100 ${
                  isOnline ? "bg-emerald-500" : "bg-base-content/40"
                }`}
              />
            </button>
            {openMenu === "profile" && <ProfileDropdown onClose={() => setOpenMenu(null)} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default RiderNavbar;