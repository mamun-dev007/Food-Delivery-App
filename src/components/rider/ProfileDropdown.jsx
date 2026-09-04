import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import { Avatar } from "../admin/SmartImage";
import { useAuthStore } from "../../store/authStore";

const ProfileDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/rider/login";
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl">
      <div className="flex items-center gap-3 border-b border-base-300 bg-base-200/50 px-4 py-3">
        <Avatar src={user?.avatar_url} name={user?.name} className="h-10 w-10" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-base-content">{user?.name || "Rider"}</p>
          <p className="truncate text-xs text-base-content/50">{user?.email}</p>
        </div>
      </div>
      <div className="p-1.5">
        <button
          onClick={() => {
            navigate("/rider/profile");
            onClose?.();
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content/80 hover:bg-base-200"
        >
          <User className="h-4 w-4" /> My Profile
        </button>
        <button
          onClick={() => {
            navigate("/rider/settings");
            onClose?.();
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content/80 hover:bg-base-200"
        >
          <Settings className="h-4 w-4" /> Settings
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-500/10"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;