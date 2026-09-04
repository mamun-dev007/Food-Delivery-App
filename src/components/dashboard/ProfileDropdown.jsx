import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronDown, User, Settings, LogOut, ImageOff } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

function initials(name) {
  return (name || "O")
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

const ProfileDropdown = ({ restaurant }) => {
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const name = user?.name || restaurant?.name || "Owner";

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-xl border border-base-300 bg-base-100 py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-base-200"
        aria-label="Account menu"
      >
        {restaurant?.logo && !imgFailed ? (
          <img
            src={restaurant.logo}
            alt={restaurant.name}
            onError={() => setImgFailed(true)}
            className="h-8 w-8 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-content">
            {initials(restaurant?.name || name)}
          </span>
        )}
        <span className="hidden text-left sm:block">
          <span className="block max-w-[140px] truncate text-xs font-semibold text-base-content">
            {restaurant?.name || name}
          </span>
          <span className="block text-[11px] text-base-content/50">Restaurant Owner</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-base-content/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-base-300 bg-base-100 py-1.5 shadow-xl">
          <div className="border-b border-base-200 px-4 py-3">
            <p className="truncate text-sm font-semibold text-base-content">{name}</p>
            <p className="text-xs text-base-content/50">{user?.email || restaurant?.name}</p>
          </div>
          <Link
            to="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-base-content/70 hover:bg-base-200"
          >
            <Settings className="h-4 w-4 text-base-content/50" /> Settings
          </Link>
          <Link
            to="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-base-content/70 hover:bg-base-200"
          >
            <User className="h-4 w-4 text-base-content/50" /> My Profile
          </Link>
          <div className="my-1 border-t border-base-200" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/10"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;