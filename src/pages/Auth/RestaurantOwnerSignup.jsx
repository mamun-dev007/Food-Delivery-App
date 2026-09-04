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
  Store,
  Image as ImageIcon,
  MapPin,
  Clock,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { uploadProfilePhoto } from "../../services/storageService";
import { ROLES, ROLE_DASHBOARD } from "../../utils/roles";

const CUISINES = [
  "Bengali",
  "Indian",
  "Chinese",
  "Fast Food",
  "Continental",
  "Thai",
  "Japanese",
  "Korean",
  "Italian",
  "Mixed",
];

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

const Field = ({ label, icon: Icon, className, textarea, ...props }) => (
  <div className={className}>
    <label className="label">
      <span className="label-text">{label}</span>
    </label>
    <div className="relative">
      {Icon && !textarea && (
        <Icon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
      )}
      {textarea ? (
        <textarea
          className="textarea textarea-bordered w-full pl-9"
          {...props}
        />
      ) : (
        <input className="input input-bordered w-full pl-9" {...props} />
      )}
    </div>
  </div>
);

const ImageUpload = ({ label, preview, onChange, inputRef }) => {
  return (
    <div>
      <label className="label">
        <span className="label-text">{label}</span>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 rounded-lg overflow-hidden border-2 border-dashed border-primary/40 bg-base-200 flex items-center justify-center flex-shrink-0"
        >
          {preview ? (
            <img src={preview} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-7 h-7 text-base-content/40" />
          )}
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn btn-outline btn-sm"
        >
          Upload
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
};

const RestaurantOwnerSignup = () => {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const loading = useAuthStore((s) => s.loading);

  // Basic
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  // Profile photo
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarRef = useRef(null);

  // Restaurant info
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantEmail, setRestaurantEmail] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [cuisine, setCuisine] = useState("");
  // Logo + cover
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const logoRef = useRef(null);
  const coverRef = useRef(null);

  // Business
  const [tradeLicense, setTradeLicense] = useState("");
  const [nid, setNid] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
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

  const upload = async (file) => (file ? uploadProfilePhoto(file) : "");

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const [avatar_url, logo_url, cover_url] = await Promise.all([
        upload(avatar),
        upload(logo),
        upload(cover),
      ]);

      const user = await signup({
        name,
        email,
        phone,
        password,
        role: ROLES.restaurantOwner,
        avatar_url,
        termsAccepted: true,
        restaurantName,
        restaurantPhone,
        restaurantEmail,
        restaurantAddress,
        city,
        area,
        logo_url,
        cover_url,
        cuisine,
        tradeLicense,
        nid,
        openingTime,
        closingTime,
        deliveryAvailable,
      });
      toast.success("Account created! We'll review your restaurant soon.");
      if (user?.status === "active") {
        navigate(ROLE_DASHBOARD[user.role]);
      } else {
        navigate("/restaurant-owner/verification");
      }
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
            Restaurant Owner Sign Up
          </h1>
          <p className="text-center text-base-content/60">
            Register your restaurant. After review, you'll get access to your
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
            <Section title="Basic Information" icon={User}>
              <div className="space-y-4">
                <Field
                  label="Owner Full Name"
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
                    placeholder="+8801XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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

            <Section title="Restaurant Information" icon={Store}>
              <div className="space-y-4">
                <Field
                  label="Restaurant Name"
                  icon={Store}
                  placeholder="e.g. Foodie Kitchen"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Restaurant Phone"
                    icon={Phone}
                    placeholder="+8801XXXXXXXXX"
                    value={restaurantPhone}
                    onChange={(e) => setRestaurantPhone(e.target.value)}
                  />
                  <Field
                    label="Restaurant Email"
                    icon={Mail}
                    type="email"
                    placeholder="restaurant@example.com"
                    value={restaurantEmail}
                    onChange={(e) => setRestaurantEmail(e.target.value)}
                  />
                </div>
                <Field
                  label="Restaurant Address"
                  icon={MapPin}
                  placeholder="Street, area"
                  value={restaurantAddress}
                  onChange={(e) => setRestaurantAddress(e.target.value)}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="City"
                    icon={MapPin}
                    placeholder="e.g. Dhaka"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                  <Field
                    label="Area"
                    icon={MapPin}
                    placeholder="e.g. Dhanmondi"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Cuisine Type</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CUISINES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCuisine(c)}
                        className={`btn btn-sm ${
                          cuisine === c ? "btn-primary" : "btn-outline"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUpload
                    label="Restaurant Logo"
                    preview={logoPreview}
                    onChange={(e) => pick(e.target.files?.[0], setLogo, setLogoPreview)}
                    inputRef={logoRef}
                  />
                  <ImageUpload
                    label="Cover Image"
                    preview={coverPreview}
                    onChange={(e) =>
                      pick(e.target.files?.[0], setCover, setCoverPreview)
                    }
                    inputRef={coverRef}
                  />
                </div>
              </div>
            </Section>

            <Section title="Business Information" icon={Clock}>
              <div className="space-y-4">
                <Field
                  label="Trade License Number"
                  icon={Store}
                  placeholder="e.g. TLA-2026-0001"
                  value={tradeLicense}
                  onChange={(e) => setTradeLicense(e.target.value)}
                />
                <Field
                  label="NID / Business Verification Number"
                  icon={User}
                  placeholder="NID number"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Opening Time"
                    icon={Clock}
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                  />
                  <Field
                    label="Closing Time"
                    icon={Clock}
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Delivery Available?</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryAvailable(true)}
                      className={`btn btn-sm ${
                        deliveryAvailable ? "btn-primary" : "btn-outline"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryAvailable(false)}
                      className={`btn btn-sm ${
                        !deliveryAvailable ? "btn-error" : "btn-outline"
                      }`}
                    >
                      No
                    </button>
                  </div>
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
              {loading ? "Please wait..." : "Create Restaurant Account"}
            </button>
          </form>

          <p className="text-center text-sm mt-5">
            Already have a restaurant account?{" "}
            <Link to="/restaurant-owner/login" className="link link-primary">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOwnerSignup;
