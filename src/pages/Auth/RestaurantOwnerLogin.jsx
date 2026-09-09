import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { ROLES } from "../../utils/roles";

const RestaurantOwnerLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login({
        email,
        password,
        role: ROLES.restaurantOwner,
      });

      // Route based on verification status.
      if (user?.isVerified === false) {
        toast.success("Logged in! Please verify your email.");
        navigate("/verify-email", {
          replace: true,
          state: { email: email.trim().toLowerCase() },
        });
      } else if (user?.status === "active") {
        navigate("/");
      } else if (user?.status === "rejected") {
        toast.error("Your restaurant application was rejected.");
        navigate("/restaurant-owner/verification");
      } else {
        // pending
        toast.success("Logged in! Your restaurant is under review.");
        navigate("/restaurant-owner/verification");
      }
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
    }
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
            Restaurant Owner portal. Login to manage your restaurant.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label">
                <span className="label-text">Restaurant Owner Email</span>
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="email"
                  className="input input-bordered w-full pl-10"
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  aria-label="Toggle password"
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
                  state={{ email, from: "/restaurant-owner/login" }}
                  className="text-sm text-primary link link-primary"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              disabled={loading}
              type="submit"
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm mt-5">
            Don't have a restaurant account?{" "}
            <Link to="/restaurant-owner/signup" className="link link-primary">
              Register Restaurant
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOwnerLogin;
