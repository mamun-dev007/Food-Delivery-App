import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Store, Bike } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { saveSignupSession } from "../../services/authService";
import { ROLES, PUBLIC_SIGNUP_ROLES } from "../../utils/roles";
import { onlyDigits, validatePhone } from "../../utils/phone";

const ROLES_META = [
  { id: ROLES.customer, label: "Customer", icon: User },
  { id: ROLES.restaurantOwner, label: "Restaurant", icon: Store },
  { id: ROLES.rider, label: "Rider", icon: Bike },
];

const Signup = () => {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const loading = useAuthStore((s) => s.loading);

  const [role, setRole] = useState(ROLES.customer);

  // Shared
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Customer
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [houseNo, setHouseNo] = useState("");

  // Restaurant
  const [restaurantName, setRestaurantName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Admin can never be selected/created from public signup.
    if (!PUBLIC_SIGNUP_ROLES.includes(role)) {
      toast.error("You cannot sign up as an Admin.");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (role === ROLES.customer) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) {
        toast.error(phoneErr);
        return;
      }
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    const payload = { name: name.trim(), email, password, role };

    if (role === ROLES.customer) {
      Object.assign(payload, { phone: onlyDigits(phone), district, street, houseNo });
    }
    if (role === ROLES.restaurantOwner) {
      payload.restaurantName = restaurantName;
    }

    try {
      const res = await signup(payload);
      saveSignupSession({
        email: email.trim().toLowerCase(),
        verificationToken: res?.verificationToken,
      });
      toast.success(
        "We sent a 6-digit code to your email. Verify it to activate your account."
      );
      navigate("/verify-email", {
        replace: true,
        state: {
          email: email.trim().toLowerCase(),
          verificationToken: res?.verificationToken,
          fromSignup: true,
        },
      });
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
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

          <h1 className="card-title text-2xl justify-center">Create Account</h1>
          <p className="text-center text-base-content/60">
            Sign up to start using Foodie.
          </p>

          {/* Role selector (public roles only — no Admin) */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {ROLES_META.map((r) => (
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

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            {role === ROLES.restaurantOwner && (
              <div>
                <label className="label">
                  <span className="label-text">Restaurant Name</span>
                </label>
                <input
                  className="input input-bordered w-full"
                  placeholder="Your restaurant name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="label">
                <span className="label-text">
                  {role === ROLES.restaurantOwner ? "Owner Name" : "Full Name"}
                </span>
              </label>
              <input
                className="input input-bordered w-full"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            {role === ROLES.customer && (
              <>
                <div>
                  <label className="label">
                    <span className="label-text">Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="input input-bordered w-full"
                    placeholder="+8801XXXXXXXXX"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(onlyDigits(e.target.value))}
                    onPaste={(e) => {
                      e.preventDefault();
                      setPhone(onlyDigits(e.clipboardData.getData("text")));
                    }}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">District</span>
                  </label>
                  <input
                    className="input input-bordered w-full"
                    placeholder="e.g. Dhaka"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Street Number</span>
                  </label>
                  <input
                    className="input input-bordered w-full"
                    placeholder="e.g. Road 5"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">House No</span>
                  </label>
                  <input
                    className="input input-bordered w-full"
                    placeholder="e.g. House 12"
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                  />
                </div>
              </>
            )}

            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Please wait..." : "Sign Up"}
            </button>
          </form>

          <div className="divider">or</div>

          <p className="text-center text-sm mt-2">
            Already have an account?{" "}
            <Link to="/auth" className="link link-primary">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
