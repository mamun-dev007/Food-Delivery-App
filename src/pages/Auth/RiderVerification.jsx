import { Link } from "react-router-dom";
import { Clock, CheckCircle2, XCircle, LogOut, Home } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

const RiderVerification = () => {
  const user = useAuthStore((s) => s.user);
  const status = user?.status || "pending";
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out.");
  };

  const isRejected = status === "rejected";
  const Icon = isRejected ? XCircle : status === "active" ? CheckCircle2 : Clock;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card bg-base-100 shadow-md w-full max-w-lg text-center">
        <div className="card-body items-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 ${
              isRejected
                ? "bg-error/10 text-error"
                : status === "active"
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            }`}
          >
            <Icon className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-bold">
            {isRejected
              ? "Verification Required"
              : status === "active"
              ? "Rider Profile Approved"
              : "Pending Verification"}
          </h1>

          <p className="text-base-content/70 mt-2 max-w-md">
            {isRejected
              ? "Your rider application was not approved. Please contact support or re-apply with the correct information."
              : status === "active"
              ? "Your rider profile has been approved. You can now access your dashboard."
              : "Thank you for applying. Our admin team is reviewing your rider profile. You'll get dashboard access once you're approved."}
          </p>

          <p className="text-sm text-base-content/50 mt-2">
            Account: <span className="font-semibold">{user?.email}</span>
          </p>

          <div className="flex gap-3 mt-6">
            {status === "active" && (
              <Link to="/rider/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            )}
            <Link to="/" className="btn btn-ghost gap-1">
              <Home className="w-4 h-4" />
              Back to Site
            </Link>
            <button onClick={handleLogout} className="btn btn-outline gap-1">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderVerification;
