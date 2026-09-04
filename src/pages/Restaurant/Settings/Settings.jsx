import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import {
  fetchOwnerSettings,
  updateOwnerSettings,
} from "../../../services/restaurantService";
import { FormSkeleton } from "../../../components/dashboard/Skeleton";

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchOwnerSettings()
      .then((s) => {
        if (active) setSettings(s);
      })
      .catch(() => {
        if (active) setSettings(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await updateOwnerSettings(settings);
      toast.success("Settings saved!");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FormSkeleton rows={7} />;
  }

  if (!settings) {
    return (
      <p className="text-center text-base-content/50 py-16">
        Could not load settings.
      </p>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-base-content/60 mt-1">
        Delivery and notification preferences for your restaurant.
      </p>

      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-md p-6 mt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Delivery Time</span>
            </label>
            <input
              name="deliveryTime"
              className="input input-bordered"
              value={settings.deliveryTime}
              onChange={handleChange}
              placeholder="e.g. 25 min"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Minimum Order (৳)</span>
            </label>
            <input
              name="minOrder"
              type="number"
              min="0"
              className="input input-bordered"
              value={settings.minOrder}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              name="autoAcceptOrders"
              type="checkbox"
              className="toggle toggle-primary"
              checked={settings.autoAcceptOrders}
              onChange={handleChange}
            />
            <span className="label-text">Auto-accept incoming orders</span>
          </label>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              name="emailNotifications"
              type="checkbox"
              className="toggle toggle-primary"
              checked={settings.emailNotifications}
              onChange={handleChange}
            />
            <span className="label-text">Email notifications</span>
          </label>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              name="smsNotifications"
              type="checkbox"
              className="toggle toggle-primary"
              checked={settings.smsNotifications}
              onChange={handleChange}
            />
            <span className="label-text">SMS notifications</span>
          </label>
        </div>

        <div className="pt-2">
          <button type="submit" className="btn btn-primary px-10" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;