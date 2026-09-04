import { useRef, useState } from "react";
import { Camera, Mail, Phone, ShieldCheck, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/authStore";
import { updateProfile } from "../../../services/authService";
import { uploadProfilePhoto } from "../../../services/storageService";
import { Avatar } from "../../../components/admin/SmartImage";

const inputCls =
  "w-full rounded-xl border border-base-300 bg-base-100 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-base-content/40 focus:border-primary";

const AdminProfile = () => {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
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
      const { user: updated } = await updateProfile({
        name: name.trim(),
        avatar_url,
        phone: phone.trim(),
      });
      setSession(token, updated);
      useAuthStore.getState().saveProfile({ name: name.trim(), avatar_url });
      setPhotoFile(null);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setUploading(false);
    }
  };

  const info = [
    { label: "Email", value: user?.email || "—", icon: Mail },
    { label: "Phone", value: phone || "—", icon: Phone },
    { label: "Role", value: "Admin", icon: ShieldCheck },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">My Profile</h1>
      <p className="text-base-content/60 mt-1">
        Your administrator account information.
      </p>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Photo + summary card */}
        <div className="card bg-base-100 shadow-md lg:col-span-2">
          <div className="card-body items-center text-center">
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
            <p className="text-xs text-base-content/50">Click to change photo</p>
            <h2 className="text-xl font-bold">{name || "Administrator"}</h2>
            <span className="badge badge-primary badge-sm gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </span>
          </div>
        </div>

        {/* Edit form + info */}
        <div className="lg:col-span-3">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="text-sm font-bold text-base-content">Edit Profile</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    Phone
                  </label>
                  <input
                    className={inputCls}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>
              <button
                className="w-fit rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus disabled:opacity-60"
                onClick={handleSave}
                disabled={uploading}
              >
                {uploading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md mt-4">
            <div className="card-body">
              {info.map((item) => (
                <div key={item.label} className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 rounded-lg bg-base-200 flex items-center justify-center text-base-content/60">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className="divider my-1" />
              <p className="flex items-center gap-2 text-sm text-base-content/50">
                <Users className="w-4 h-4" />
                Full platform management access
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;