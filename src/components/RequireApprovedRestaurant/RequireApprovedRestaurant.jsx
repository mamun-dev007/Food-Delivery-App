// Guards the restaurant-owner dashboard so that pending/rejected restaurants
// cannot access it. The backend still enforces the real role; this only gates
// the UI based on the account's verification status.

import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Loader1 as Loader } from "../Loader/Loader";
import { ROLES } from "../../utils/roles";

export const RequireApprovedRestaurant = ({ children }) => {
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

  // Not logged in -> login portal.
  if (!user) {
    return <Navigate to="/restaurant-owner/login" replace />;
  }

  // Not a restaurant owner -> own dashboard.
  if (role !== ROLES.restaurantOwner) {
    return <Navigate to="/" replace />;
  }

  // Email not verified yet -> verification page.
  if (user.isVerified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  // Pending / rejected -> verification notice.
  if (user.status !== "active") {
    return <Navigate to="/restaurant-owner/verification" replace />;
  }

  return children;
};
