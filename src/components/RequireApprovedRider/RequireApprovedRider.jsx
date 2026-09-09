// Guards the rider dashboard so that pending/rejected riders cannot access it.
// The backend still enforces the real role; this only gates the UI based on
// the account's verification status.

import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Loader1 as Loader } from "../Loader/Loader";
import { ROLES } from "../../utils/roles";

export const RequireApprovedRider = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const initializing = useAuthStore((s) => s.initializing);

  if (initializing) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/rider/login" replace />;
  }

  if (role !== ROLES.rider) {
    return <Navigate to="/" replace />;
  }

  if (user.isVerified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  if (user.status !== "active") {
    return <Navigate to="/rider/verification" replace />;
  }

  return children;
};
