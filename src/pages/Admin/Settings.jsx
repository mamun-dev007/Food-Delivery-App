import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { RefreshCw, UserCircle, Settings as SettingsIcon, Percent, ArrowRight } from "lucide-react";
import { fetchAdminSettings } from "../../services/adminService";
import { Avatar } from "../../components/admin/SmartImage";
import { FormSkeleton } from "../../components/dashboard/Skeleton";

const TOGGLES = [
  {
    key: "auto_approve_restaurants",
    label: "Auto-approve restaurants",
    desc: "New restaurant owner requests are approved immediately without manual review.",
  },
  {
    key: "auto_approve_riders",
    label: "Auto-approve riders",
    desc: "New rider requests are approved immediately without manual review.",
  },
  {
    key: "maintenance_mode",
    label: "Maintenance mode",
    desc: "Temporarily take the platform offline for maintenance.",
  },
];

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminSettings();
      setSettings(data);
    } catch (err) {
      toast.error(err?.message || "Could not load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reload = () => load();

  if (loading) return <FormSkeleton rows={6} />;

  const platform = settings?.platform || {};
  const commissionRate = Number(platform.commission_rate ?? 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">Settings</h1>
          <p className="mt-0.5 text-sm text-base-content/50">Admin profile and platform configuration</p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-base-content">Admin Profile</h3>
            </div>
            <Link
              to="/admin/profile"
              className="flex items-center gap-1 rounded-xl border border-base-300 px-3 py-2 text-xs font-semibold text-base-content/70 transition-colors hover:bg-base-200"
            >
              Edit profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-start gap-4">
            <Avatar src={settings?.avatar_url} name={settings?.name} className="h-16 w-16" />
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-base-content/50">Name</p>
                <p className="text-sm text-base-content/70">{settings?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50">Email</p>
                <p className="break-all text-sm text-base-content/70">{settings?.email || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-base-content">Platform Settings</h3>
          </div>
          <div className="mt-2">
            {TOGGLES.map((t, i) => {
              const on = !!platform[t.key];
              return (
                <div
                  key={t.key}
                  className={`flex items-center justify-between gap-4 py-3 ${i < TOGGLES.length - 1 ? "border-b border-base-100" : ""}`}
                >
                  <div>
                    <p className="text-sm font-medium text-base-content">{t.label}</p>
                    <p className="text-sm text-base-content/60">{t.desc}</p>
                  </div>
                  <button
                    onClick={() => toast.info("Settings update is not available yet.")}
                    className={`flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      on ? "bg-emerald-500" : "bg-base-200"
                    }`}
                    aria-label={t.label}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white shadow ${on ? "ml-auto mr-1" : "ml-1"}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-base-content">Commission</h3>
        </div>
        <p className="mt-0.5 text-sm text-base-content/50">Per-order commission charged to restaurants</p>
        <div className="mt-4 inline-flex items-baseline gap-1 rounded-xl bg-primary/10 px-5 py-4">
          <span className="text-3xl font-bold tracking-tight text-base-content">{commissionRate}</span>
          <span className="text-2xl font-bold text-primary">%</span>
        </div>
      </div>
    </div>
  );
};

export default Settings;