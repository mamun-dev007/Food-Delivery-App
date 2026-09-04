import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import DateRangePicker from "./DateRangePicker";
import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

const TopNavbar = ({ onToggleSidebar, restaurant, notifications, unreadCount, onNotificationsRead, onNotificationRead, range, onRangeChange }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/60 hover:bg-base-200 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={submitSearch} className="relative hidden flex-1 max-w-md md:block">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/50">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
            className="h-10 w-full rounded-xl border border-base-300 bg-base-200 pl-10 pr-3 text-sm text-base-content outline-none transition-all placeholder:text-base-content/50 focus:border-primary focus:bg-base-100 focus:ring-2 focus:ring-primary/20"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200" />
          <div className="hidden sm:block">
            <DateRangePicker value={range} onChange={onRangeChange} compact />
          </div>
          <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onReadAll={onNotificationsRead}
              onReadOne={onNotificationRead}
            />
          <ProfileDropdown restaurant={restaurant} />
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;