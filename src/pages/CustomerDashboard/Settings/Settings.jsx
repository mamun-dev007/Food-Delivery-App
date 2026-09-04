import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";
import toast from "react-hot-toast";
import {
  loadCustomerSettings,
  saveCustomerSettings,
} from "../../../services/customerService";
import { useThemeStore } from "../../../store/themeStore";

const Settings = () => {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setThemeAndSync);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    setSettings(loadCustomerSettings());
  }, []);

  if (!settings) return null;

  const update = (patch) => setSettings((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    saveCustomerSettings(settings);
    toast.success("Settings saved successfully!");
  };

  const toggleRow = ({ label, desc, checked, onChange, control = "toggle" }) => (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
      <span>
        <span className="block text-sm font-medium text-base-content">{label}</span>
        {desc && <span className="mt-0.5 block text-xs text-base-content/50">{desc}</span>}
      </span>
      {control === "toggle" ? (
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      ) : (
        <select
          className="select select-bordered select-sm w-36"
          value={String(checked)}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="en">English</option>
          <option value="bn">Bengali</option>
          <option value="ar">Arabic</option>
        </select>
      )}
    </label>
  );

  return (
    <div className="mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-base-content">Settings</h1>
        <p className="text-sm text-base-content/50">
          Customize your account preferences. Saved on this device.
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification preferences */}
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div className="border-b border-base-200 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-base-content">
              <SettingsIcon className="h-4 w-4 text-primary" /> Notification Preferences
            </h2>
          </div>
          <div className="divide-y divide-base-200 px-5">
            {toggleRow({
              label: "Email Notifications",
              desc: "Order updates and account alerts to your inbox.",
              checked: settings.emailNotifications,
              onChange: (v) => update({ emailNotifications: v }),
            })}
            {toggleRow({
              label: "SMS Notifications",
              desc: "Text message alerts for delivery updates.",
              checked: settings.smsNotifications,
              onChange: (v) => update({ smsNotifications: v }),
            })}
            {toggleRow({
              label: "Order Updates",
              desc: "Live status changes for your orders.",
              checked: settings.orderUpdates,
              onChange: (v) => update({ orderUpdates: v }),
            })}
            {toggleRow({
              label: "Promotions & Offers",
              desc: "Exclusive deals and promo codes.",
              checked: settings.promotions,
              onChange: (v) => update({ promotions: v }),
            })}
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div className="border-b border-base-200 px-5 py-4">
            <h2 className="text-sm font-bold text-base-content">Appearance</h2>
          </div>
          <div className="divide-y divide-base-200 px-5">
            {toggleRow({
              label: "Dark Mode",
              desc: "Switch between light and dark themes.",
              checked: theme === "dark",
              onChange: (v) => setTheme(v ? "dark" : "light"),
            })}
            {toggleRow({
              label: "Language",
              control: "select",
              checked: settings.language,
              onChange: (v) =>
                update({ language: ["en", "bn", "ar"].includes(v) ? v : "en" }),
            })}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus"
        >
          <Save className="h-4 w-4" /> Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;