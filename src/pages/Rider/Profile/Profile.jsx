import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  Bike,
  Car,
  FileText,
  MapPin,
  Phone,
  Save,
  Shield,
  Star,
} from "lucide-react";
import { fetchRiderProfile, updateRiderSettings } from "../../../services/riderService";
import { Avatar } from "../../../components/admin/SmartImage";
import RiderStatCard from "../../../components/rider/RiderStatCard";
import { fmtDate } from "../../../components/rider/shared";

const VEHICLES = ["Bike", "Scooter", "Car"];

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("Bike");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await fetchRiderProfile();
      setProfile(p);
      setPhone(p?.phone || "");
      setVehicle(p?.vehicleType || "Bike");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await updateRiderSettings({ phone, vehicle });
      toast.success("Profile updated.");
      if (profile) setProfile({ ...profile, phone, vehicleType: vehicle });
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4">
        <div className="h-48 animate-pulse rounded-2xl border border-base-300 bg-base-200/60" />
        <div className="h-72 animate-pulse rounded-2xl border border-base-300 bg-base-200/60" />
      </div>
    );
  }

  const p = profile || {};
  const initial = (p.name || "R").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <div className="h-28 bg-gradient-to-r from-[#570df8] to-[#f000b8]" />
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <Avatar
              src={p.photoURL}
              name={initial}
              className="h-24 w-24 rounded-2xl border-4 border-base-100 text-3xl shadow-lg"
            />
            <div className="pb-1">
              <p className="text-xl font-bold text-base-content">{p.name || "Rider"}</p>
              <p className="text-sm text-base-content/50">{p.email}</p>
              <span
                className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                  p.isOnline ? "bg-emerald-500/10 text-emerald-600" : "bg-base-200 text-base-content/50"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${p.isOnline ? "bg-emerald-500" : "bg-base-content/40"}`} />
                {p.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span className="text-lg font-extrabold text-amber-600">{p.rating ? Number(p.rating).toFixed(1) : "—"}</span>
            <span className="text-xs text-amber-600/70">rating</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RiderStatCard label="Total Deliveries" value={p.totalDeliveries ?? 0} icon={Bike} tint="blue" />
        <RiderStatCard label="Vehicle" value={p.vehicleType || "—"} icon={Car} tint="orange" />
        <RiderStatCard label="Rating" value={p.rating ? Number(p.rating).toFixed(1) : "—"} icon={Star} tint="amber" />
        <RiderStatCard
          label="Joined"
          value={p.joined ? fmtDate(p.joined, { year: "numeric" }) : "—"}
          icon={Shield}
          tint="green"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Identity info */}
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-bold text-base-content">
            <BadgeCheck className="h-5 w-5 text-primary" /> Identity & Documents
          </h3>
          <div className="mt-4 space-y-4 text-sm">
            {[
              { icon: Phone, label: "Phone", value: p.phone || "—" },
              { icon: MapPin, label: "Address", value: p.address || "Dhaka, Bangladesh" },
              { icon: Car, label: "Vehicle Number", value: p.vehicleNumber || "—" },
              { icon: FileText, label: "License", value: p.license || "—" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-base-200 text-base-content/60">
                  <r.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-base-content/50">{r.label}</p>
                  <p className="font-semibold text-base-content">{r.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editable contact / vehicle */}
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-bold text-base-content">
            <Shield className="h-5 w-5 text-primary" /> Contact & Vehicle
          </h3>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-base-content/70">Phone number</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm text-base-content outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-base-content/70">Vehicle</span>
              <select
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm text-base-content outline-none focus:border-primary"
              >
                {VEHICLES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;