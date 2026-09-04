import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { ROLE_DASHBOARD } from "../../utils/roles";

const Unauthorized = () => {
  const role = useAuthStore((s) => s.role);

  return (
    <div className="my-16 flex justify-center px-4">
      <div className="card bg-base-100 shadow-md w-full max-w-md text-center">
        <div className="card-body items-center">
          <ShieldAlert className="w-16 h-16 text-error" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-base-content/60">
            You do not have permission to view this page.
          </p>
          <div className="mt-4">
            <Link
              to={role ? ROLE_DASHBOARD[role] || "/" : "/"}
              className="btn btn-primary"
            >
              Go to your dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
