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
  Bike,
  ShieldCheck,
  Wallet,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { uploadProfilePhoto } from "../../services/storageService";
import { saveSignupSession } from "../../services/authService";
import { ROLES } from "../../utils/roles";
import { onlyDigits, validatePhone } from "../../utils/phone";

const VEHICLE_TYPES = ["Bicycle", "Motorcycle", "Scooter", "Other"];

const PAYMENT_METHODS = ["bKash", "Nagad"];

const Section = ({ title, icon: Icon, children }) => (
  <div className="mt-6">
    <h2 className="flex items-center gap-2 font-semibold text-base-content">
      <Icon className="w-4 h-4 text-primary" />
      {title}
    </h2>
    <div className="divider mt-1 mb-3" />
    {children}
  </div>
);

const Field = ({ label, icon: Icon, className, ...props }) => (
  <div className={className}>
    <label className="label">
      <span className="label-text">{label}</span>
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
      )}
      <input className="input input-bordered w-full pl-9" {...props} />
    </div>
  </div>
);

const RiderSignup = () => {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const loading = useAuthStore((s) => s.loading);

  // Personal
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarRef = useRef(null);

  // Delivery
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  // Verification (text only, optional)
  const [nid, setNid] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("");

  // Terms
  const [agree, setAgree] = useState(false);

  const pick = (file, setFile, setPreview) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
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
    if (!agree) {
      toast.error("You must agree to the Terms & Conditions.");
      return;
    }

    try {
      const avatar_url = avatar ? await uploadProfilePhoto(avatar) : "";

      const res = await signup({
        name: name.trim(),
        email,
        phone: onlyDigits(phone),
        password,
        role: ROLES.rider,
        avatar_url,
        deliveryAddress,
        city,
        area,
        vehicleType,
        nid,
        drivingLicense,
        paymentMethod,
        termsAccepted: true,
      });
      saveSignupSession({
        email: email.trim().toLowerCase(),
        verificationToken: res?.verificationToken,
      });
      toast.success(
        "We sent a 6-digit code to your email. Verify it to submit your application."
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
      <div className="card bg-base-100 shadow-md w-full max-w-2xl">
        <div className="card-body">
          <Link to="/" className="btn btn-ghost btn-sm w-fit gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="card-title text-2xl justify-center mt-2">
            Apply as Delivery Rider
          </h1>
          <p className="text-center text-base-content/60">
            Join our delivery team. After review, you'll get access to your
            dashboard.
          </p>

          {/* Profile photo */}
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-primary/50 bg-base-200 flex items-center justify-center"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-base-content/40" />
              )}
            </button>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0], setAvatar, setAvatarPreview)}
            />
          </div>
          <p className="text-center text-xs text-base-content/50 -mt-2">
            Profile Photo
          </p>

          <form onSubmit={handleSubmit} className="mt-2">
            <Section title="Personal Information" icon={User}>
              <div className="space-y-4">
                <Field
                  label="Full Name"
                  icon={User}
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Email"
                    icon={Mail}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Field
                    label="Phone Number"
                    icon={Phone}
                    type="tel"
                    inputMode="numeric"
                    placeholder="+8801XXXXXXXXX"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(onlyDigits(e.target.value))}
                    onPaste={(e) => {
                      e.preventDefault();
                      setPhone(onlyDigits(e.clipboardData.getData("text")));
                    }}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Password"
                    icon={Lock}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Field
                    label="Confirm Password"
                    icon={Lock}
                    type={showPw2 ? "text" : "password"}
                    placeholder="••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>
            </Section>

            <Section title="Delivery Information" icon={Bike}>
              <div className="space-y-4">
                <Field
                  label="Address"
                  icon={MapPin}
                  placeholder="Street address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="City"
                    icon={MapPin}
                    placeholder="e.g. Dhaka"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <Field
                    label="Area"
                    icon={MapPin}
                    placeholder="e.g. Dhanmondi"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Vehicle Type</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {VEHICLE_TYPES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVehicleType(v)}
                        className={`btn btn-sm ${
                          vehicleType === v ? "btn-primary" : "btn-outline"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Verification" icon={ShieldCheck}>
              <div className="space-y-4">
                <Field
                  label="NID Number (optional)"
                  icon={User}
                  placeholder="National ID number"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                />
                <Field
                  label="Driving License Number (for motor vehicles, optional)"
                  icon={ShieldCheck}
                  placeholder="Driving license number"
                  value={drivingLicense}
                  onChange={(e) => setDrivingLicense(e.target.value)}
                />
              </div>
            </Section>

            <Section title="Payment" icon={Wallet}>
              <div>
                <label className="label">
                  <span className="label-text">Preferred Payment Method</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPaymentMethod(p)}
                      className={`btn btn-sm ${
                        paymentMethod === p ? "btn-primary" : "btn-outline"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <label className="flex items-start gap-2 cursor-pointer mt-8">
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
              className="btn btn-primary w-full mt-4"
              disabled={loading}
              type="submit"
            >
              {loading ? "Please wait..." : "Apply as Delivery Rider"}
            </button>
          </form>

          <p className="text-center text-sm mt-5">
            Already a rider?{" "}
            <Link to="/rider/login" className="link link-primary">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiderSignup;
