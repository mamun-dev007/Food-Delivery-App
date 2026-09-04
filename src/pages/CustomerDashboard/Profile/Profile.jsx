import { useRef, useState } from "react";
import { BadgeCheck, Camera, ChefHat, Mail, Phone, ReceiptText, Shield } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { updateProfile } from "../../../services/authService";
import { uploadProfilePhoto } from "../../../services/storageService";
import { useOrderSummary } from "../../../hooks/useOrderSummary";
import CustomerStatCard from "../../../components/customer/CustomerStatCard";
import { Avatar } from "../../../components/admin/SmartImage";
import { fmtMoney } from "../../../components/rider/shared";
import toast from "react-hot-toast";

const Profile = () => {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);
  const { orders, loading: ordersLoading } = useOrderSummary("year");

  const [name, setName] = useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setPhotoFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setUploading(true);
    try {
      let avatar_url = user?.avatar_url || "";
      if (photoFile) {
        avatar_url = await uploadProfilePhoto(photoFile);
      }
      const updatedUser = { ...user, name: name.trim(), avatar_url };
      setSession(token, updatedUser);
      useAuthStore.getState().saveProfile({ name: name.trim(), avatar_url });
      try {
        await updateProfile({ name: name.trim(), avatar_url });
      } catch {
        // API backup — local save already done.
      }
      setPhotoFile(null);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setUploading(false);
    }
  };

  const active = orders.filter((o) =>
    ["Pending", "Preparing", "On The Way"].includes(o.status),
  ).length;
  const delivered = orders.filter((o) => o.status === "Delivered").length;
  const spent = orders.reduce(
    (s, o) => s + (o.status !== "Cancelled" ? Number(o.total_amount || 0) : 0),
    0,
  );

  const inputCls =
    "w-full rounded-xl border border-base-300 bg-base-100 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-base-content/40 focus:border-primary";

  return (
    <div className="mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-base-content">My Profile</h1>
        <p className="text-sm text-base-content/50">
          Your account details and ordering statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="h-fit rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div
              className="group relative cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar src={avatarPreview} name={name} className="h-24 w-24" />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <p className="mt-2 text-xs text-base-content/50">Click to change photo</p>
            <h2 className="mt-2 text-xl font-bold text-base-content">{name || "Customer"}</h2>
            <p className="text-sm text-base-content/60">{user?.email}</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified Customer
            </span>
          </div>

          <div className="mt-6 divide-y divide-base-200 border-t border-base-200">
            <div className="flex items-center gap-3 py-3">
              <Mail className="h-4 w-4 text-base-content/40" />
              <span className="text-sm text-base-content/70">{user?.email || "—"}</span>
            </div>
            <div className="flex items-center gap-3 py-3">
              <Phone className="h-4 w-4 text-base-content/40" />
              <span className="text-sm text-base-content/70">{user?.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-3 py-3">
              <Shield className="h-4 w-4 text-base-content/40" />
              <span className="text-sm capitalize text-base-content/70">
                {user?.role || "customer"} account
              </span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CustomerStatCard
              label="Total Orders"
              value={orders.length}
              icon={ReceiptText}
              tint="purple"
              loading={ordersLoading}
            />
            <CustomerStatCard
              label="Active"
              value={active}
              icon={ChefHat}
              tint="amber"
              loading={ordersLoading}
            />
            <CustomerStatCard
              label="Delivered"
              value={delivered}
              icon={BadgeCheck}
              tint="green"
              loading={ordersLoading}
            />
            <CustomerStatCard
              label="Total Spent"
              value={fmtMoney(spent)}
              icon={ReceiptText}
              tint="orange"
              loading={ordersLoading}
            />
          </div>

          {/* Edit form */}
          <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-base-content">Edit Profile</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-base-content/60">
                  Full Name
                </label>
                <input
                  className={inputCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-base-content/60">
                  Email
                </label>
                <input
                  className={`${inputCls} bg-base-200`}
                  type="email"
                  value={user?.email || ""}
                  disabled
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-base-content/60">
                  Phone
                </label>
                <input
                  className={`${inputCls} bg-base-200`}
                  type="tel"
                  value={user?.phone || "—"}
                  disabled
                />
              </div>
            </div>
            <button
              className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus disabled:opacity-60"
              onClick={handleSave}
              disabled={uploading}
            >
              {uploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;