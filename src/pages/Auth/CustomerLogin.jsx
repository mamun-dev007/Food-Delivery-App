import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { ROLES } from "../../utils/roles";
import { auth } from "../../firebase/config";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login({
        email: identifier,
        password,
        role: ROLES.customer,
      });
      toast.success("Logged in!");
      // If the account hasn't been email-verified yet, send the user to the
      // verification page before letting them into the app.
      if (user?.isVerified === false) {
        navigate("/verify-email", {
          replace: true,
          state: { email: identifier.trim().toLowerCase() },
        });
        return;
      }
      // If the user was redirected here (e.g. from "Add to Cart" on a food
      // page), return them to where they were. Otherwise go to home page.
      const from = location.state?.from;
      if (from && typeof from === "string") {
        navigate(from, { replace: true });
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
    }
  };

  const handleGoogle = () => {
    // Google sign-in placeholder (not wired up yet).
    toast.info("Google sign-in is coming soon.");
    void auth;
  };

  return (
    <div className="my-12 flex justify-center px-4">
      <div className="card bg-base-100 shadow-md w-full max-w-md">
        <div className="card-body">
          <Link to="/" className="btn btn-ghost btn-sm w-fit gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="card-title text-2xl justify-center mt-2">Login</h1>
          <p className="text-center text-base-content/60">
            Welcome back! Login to your account to continue.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label">
                <span className="label-text">Email / Phone</span>
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="you@example.com or +8801XXXXXXXXX"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type={showPw ? "text" : "password"}
                  className="input input-bordered w-full pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link
                  to="/forgot-password"
                  state={{
                    email: identifier.includes("@") ? identifier : "",
                    from: "/customer/login",
                  }}
                  className="text-sm text-primary link link-primary"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="text-sm">Remember Me</span>
              </label>
            </div>

            <button
              className="btn btn-primary w-full"
              disabled={loading}
              type="submit"
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>

          <div className="divider">or</div>

          <button
            type="button"
            onClick={handleGoogle}
            className="btn btn-outline w-full gap-2"
          >
            <FcGoogle className="w-5 h-5" />
            Continue with Google
          </button>

          <p className="text-center text-sm mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="link link-primary">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
