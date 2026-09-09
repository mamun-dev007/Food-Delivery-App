import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { uploadProfilePhoto } from "../../services/storageService";
import { saveSignupSession } from "../../services/authService";
import { ROLES } from "../../utils/roles";
import { onlyDigits, validatePhone } from "../../utils/phone";

const CustomerSignup = () => {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const loading = useAuthStore((s) => s.loading);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [agree, setAgree] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoInputRef = useRef(null);

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error("Please enter your delivery address.");
      return;
    }
    if (!agree) {
      toast.error("You must agree to the Terms & Conditions.");
      return;
    }

    try {
      let avatar_url = "";
      if (photoFile) {
        avatar_url = await uploadProfilePhoto(photoFile);
      }

      const res = await signup({
        name: name.trim(),
        email,
        phone: onlyDigits(phone),
        password,
        role: ROLES.customer,
        deliveryAddress,
        avatar_url,
        termsAccepted: true,
      });
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
          <Link to="/" className="btn btn-ghost btn-sm w-fit gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="card-title text-2xl justify-center mt-2">Sign Up</h1>
          <p className="text-center text-base-content/60">
            Create your account to start ordering with Foodie.
          </p>

          {/* Profile photo upload */}
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-primary/50 bg-base-200 flex items-center justify-center"
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-base-content/40" />
              )}
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-0.5">
                Photo
              </span>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoChange}
            />
          </div>
          <p className="text-center text-xs text-base-content/50 -mt-2">
            Profile Photo — optional
          </p>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Email Address</span>
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="email"
                  className="input input-bordered w-full pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Phone Number</span>
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="tel"
                  inputMode="numeric"
                  className="input input-bordered w-full pl-10"
                  placeholder="+8801XXXXXXXXX"
                  value={phone}
                  maxLength={11}
                  onChange={(e) => setPhone(onlyDigits(e.target.value))}
                  onPaste={(e) => {
                    e.preventDefault();
                    setPhone(onlyDigits(e.clipboardData.getData("text")));
                  }}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    type={showPw ? "text" : "password"}
                    className="input input-bordered w-full pl-9 pr-9"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/50"
                    aria-label="Toggle password"
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Confirm</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    type={showPw2 ? "text" : "password"}
                    className="input input-bordered w-full pl-9 pr-9"
                    placeholder="••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw2((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/50"
                    aria-label="Toggle confirm"
                  >
                    {showPw2 ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Delivery Address</span>
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 absolute left-3 top-3 text-base-content/40" />
                <textarea
                  className="textarea textarea-bordered w-full pl-10"
                  rows={2}
                  placeholder="House, Road, Area, District"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary mt-0.5"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span className="text-sm">
                I agree to the{" "}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="link link-primary"
                >
                  Terms &amp; Conditions
                </a>
              </span>
            </label>

            <button
              className="btn btn-primary w-full"
              disabled={loading}
              type="submit"
            >
              {loading ? "Please wait..." : "Create Account"}
            </button>
          </form>

          <div className="divider">or</div>

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignup;
