// Frontend route guard.
//
// IMPORTANT: This provides UI protection only. Real authorization is always
// enforced on the backend via verifyFirebaseToken + verifyRole. Do not rely
// solely on this component for security.

import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Loader1 as Loader } from "../Loader/Loader";
import { ROLE_DASHBOARD } from "../../utils/roles";

/**
 * RequireAuth — gate a page behind an authenticated session and, optionally,
 * one or more allowed roles.
 *
 * Usage:
 *   <RequireAuth allowedRoles={["admin"]}> <AdminDashboard/> </RequireAuth>
 *   <RequireAuth> ...any authenticated user... </RequireAuth>
 *
 * Behaviour:
 *   - While the session is being restored (e.g. after refresh) show a loader.
 *   - Not logged in      -> redirect to /auth (remembers where you were).
 *   - Logged in, wrong role -> redirect to the user's own dashboard.
 *   - Logged in, correct    -> render children.
 */
export const RequireAuth = ({ allowedRoles, children }) => {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const initializing = useAuthStore((s) => s.initializing);
  const location = useLocation();

  if (initializing) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Not logged in.
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Logged in but not allowed on this page -> own dashboard.
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_DASHBOARD[role] || "/"} replace />;
  }

  return children;
};
