import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, User, Store, Bike, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import {
  ROLES,
  ROLE_DASHBOARD,
  ROLE_LABELS,
} from "../../utils/roles";

const ROLE_META = [
  { id: ROLES.customer, label: "Customer", icon: User },
  { id: ROLES.restaurantOwner, label: "Restaurant", icon: Store },
  { id: ROLES.rider, label: "Rider", icon: Bike },
  { id: ROLES.admin, label: "Admin", icon: Crown },
];

// Hard-coded demo admin credentials used by the one-click "Admin Login" button.
// Admin accounts are NEVER created through public signup — this is a safe
// backend-provisioned account (admin@mamun.com, role: admin in MongoDB).
const DEMO_ADMIN = {
  email: "admin@mamun.com",
  password: "Admin@12345",
};

/**
 * Role-based login page. The active role is fixed by the route it is mounted
 * under (e.g. /admin/login), so a user on the wrong portal is rejected by the
 * backend. The role is never taken from the URL/query as a credential — the
 * backend always verifies the real MongoDB role from the Firebase ID token.
 */
const Login = ({ role: fixedRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  // If no fixed role is given, use the ?role= query (legacy /auth links).
  const [role, setRole] = useState(
    fixedRole ||
      (ROLE_META.some((r) => r.id === new URLSearchParams(location.search).get("role"))
        ? new URLSearchParams(location.search).get("role")
        : ROLES.customer)
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login({ email, password, role });
      toast.success("Logged in!");
      navigate(ROLE_DASHBOARD[user?.role] || "/");
    } catch (err) {
      toast.error(err?.message || err?.response?.data?.error || "Something went wrong");
    }
  };

  // One-click admin login using the hard-coded credentials.
  const handleAdminQuickLogin = async () => {
    try {
      const user = await login({
        email: DEMO_ADMIN.email,
        password: DEMO_ADMIN.password,
        role: ROLES.admin,
      });
      toast.success("Logged in as Admin!");
      navigate(ROLE_DASHBOARD[user?.role] || "/");
    } catch (err) {
      toast.error(err?.message || "Admin login failed.");
    }
  };

  return (
    <div className="my-12 flex justify-center px-4">
      <div className="card bg-base-100 shadow-md w-full max-w-md">
        <div className="card-body">
          <Link to="/auth" className="btn btn-ghost btn-sm w-fit gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="card-title text-2xl justify-center">Welcome Back</h1>
          <p className="text-center text-base-content/60">
            Login to continue as {ROLE_LABELS[role] || "your role"}.
          </p>

          {/* Role selector (only shown when the page is not locked to one role) */}
          {!fixedRole && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {ROLE_META.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`btn btn-sm gap-1 ${
                    role === r.id ? "btn-primary" : "btn-outline"
                  }`}
                >
                  <r.icon className="w-4 h-4" />
                  {r.label}
                </button>
              ))}
            </div>
          )}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>

          {role === ROLES.admin && (
            <button
              type="button"
              onClick={handleAdminQuickLogin}
              className="btn btn-outline w-full gap-1 mt-3"
              disabled={loading}
            >
              <Crown className="w-4 h-4" />
              Login with Admin Credentials
            </button>
          )}

          <div className="divider">or</div>

          <p className="text-center text-sm mt-2">
            New to Foodie?{" "}
            <Link to="/signup" className="link link-primary">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
