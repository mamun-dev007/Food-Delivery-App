import { useNavigate } from "react-router-dom";
import { CreditCard, Heart, LogOut, MapPin, User } from "lucide-react";
import { Avatar } from "../admin/SmartImage";
import { useAuthStore } from "../../store/authStore";

const CustomerProfileDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/customer/login";
  };

  const go = (to) => {
    navigate(to);
    onClose?.();
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl">
      <div className="flex items-center gap-3 border-b border-base-300 bg-base-200/50 px-4 py-3">
        <Avatar src={user?.avatar_url} name={user?.name} className="h-10 w-10" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-base-content">
            {user?.name || "Customer"}
          </p>
          <p className="truncate text-xs text-base-content/50">{user?.email}</p>
        </div>
      </div>
      <div className="p-1.5">
        <button
          onClick={() => go("/customer/dashboard/profile")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content/80 hover:bg-base-200"
        >
          <User className="h-4 w-4" /> My Profile
        </button>
        <button
          onClick={() => go("/customer/dashboard/addresses")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content/80 hover:bg-base-200"
        >
          <MapPin className="h-4 w-4" /> Addresses
        </button>
        <button
          onClick={() => go("/customer/dashboard/payment-methods")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content/80 hover:bg-base-200"
        >
          <CreditCard className="h-4 w-4" /> Payment Methods
        </button>
        <button
          onClick={() => go("/customer/favorites")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content/80 hover:bg-base-200"
        >
          <Heart className="h-4 w-4" /> Favorites
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-error hover:bg-error/10"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default CustomerProfileDropdown;