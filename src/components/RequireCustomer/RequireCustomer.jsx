// Customer-only route guard (UX layer).
//
// Logged-out users are sent to the Customer Login page (preserving the intended
// destination). Logged-in users of other roles (restaurantOwner/rider/admin)
// are sent to their own dashboard. Real authorization is still enforced on the
// backend via verifyFirebaseToken + verifyRole("customer").

import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Loader1 as Loader } from "../Loader/Loader";
import { ROLE_DASHBOARD, ROLES } from "../../utils/roles";

export const RequireCustomer = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const initializing = useAuthStore((s) => s.initializing);
  const location = useLocation();

  // Wait until Firebase/backend has restored the auth state.
  if (initializing) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Not logged in -> Customer Login, remembering where they were headed.
  if (!user) {
    return (
      <Navigate
        to="/customer/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Email not verified yet -> verification page.
  if (user.isVerified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  // Logged in but not a customer -> redirect to the user's own dashboard.
  if (role !== ROLES.customer) {
    return <Navigate to={ROLE_DASHBOARD[role] || "/"} replace />;
  }

  return children;
};

export default RequireCustomer;
