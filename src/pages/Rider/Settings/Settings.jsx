import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Bell, Bike, Phone, Save, Settings2 } from "lucide-react";
import { fetchRiderSettings, updateRiderSettings } from "../../../services/riderService";

const VEHICLES = ["Bike", "Scooter", "Car"];

const Settings = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("Bike");
  const [maxDistance, setMaxDistance] = useState(15);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchRiderSettings();
      setPhone(s.phone || "");
      setVehicle(s.vehicle || "Bike");
      setMaxDistance(Number(s.max_distance) || 15);
      setNotifications(s.notifications != null ? !!s.notifications : true);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load settings.");
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
      await updateRiderSettings({ phone, vehicle, max_distance: maxDistance, notifications });
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[700px] space-y-4">
        <div className="h-64 animate-pulse rounded-2xl border border-base-300 bg-base-200/60" />
      </div>
    );
  }

  const field = "w-full rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm text-base-content outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
  const label = "mb-1.5 block text-sm font-medium text-base-content/70";

  return (
    <div className="mx-auto max-w-[700px]">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-base-content">
        <Settings2 className="h-5 w-5 text-primary" /> Settings
      </h2>
      <p className="mt-0.5 text-sm text-base-content/50">Manage how you receive deliveries</p>

      <div className="mt-5 space-y-4 rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
        <label className="block">
          <span className={label}>Phone number</span>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className={`${field} pl-10`}
            />
          </div>
        </label>

        <label className="block">
          <span className={label}>Vehicle</span>
          <div className="relative">
            <Bike className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className={`${field} pl-10`}
            >
              {VEHICLES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div>
          <div className="flex items-center justify-between">
            <span className={label}>Maximum delivery distance</span>
            <span className="text-sm font-bold text-primary">{maxDistance} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="range range-sm range-primary w-full"
          />
          <p className="mt-1 text-xs text-base-content/50">
            We'll only show you orders within this distance.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-base-300 bg-base-200/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-base-content">Push notifications</p>
              <p className="text-xs text-base-content/50">New order alerts and updates</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Settings"}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-5 py-2.5 text-sm font-semibold text-base-content transition-colors hover:bg-base-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    </div>
  );
};

export default Settings;