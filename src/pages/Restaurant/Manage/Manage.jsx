import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, UtensilsCrossed } from "lucide-react";
import {
  fetchOwnerRestaurantProfile,
  updateOwnerRestaurantProfile,
} from "../../../services/restaurantService";

const ManageRestaurant = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await fetchOwnerRestaurantProfile();
      setProfile(p);
    } catch {
      toast.error("Failed to load restaurant profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    cuisine: "Mixed",
    address: "",
    phone: "",
    email: "",
    deliveryTime: "25 min",
    minOrder: 0,
    open: true,
    logoUrl: "",
    bannerUrl: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        tagline: profile.tagline || "",
        cuisine: profile.cuisine || "Mixed",
        address: profile.address || "",
        phone: profile.phone || "",
        email: profile.email || "",
        deliveryTime: profile.deliveryTime || "25 min",
        minOrder: profile.minOrder ?? 0,
        open: profile.open != null ? profile.open : true,
        logoUrl: profile.logo_url || "",
        bannerUrl: profile.banner_url || "",
      });
    }
  }, [profile]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleToggle = async () => {
    const next = !form.open;
    setForm((p) => ({ ...p, open: next }));
    try {
      await updateOwnerRestaurantProfile({ ...form, open: next });
      toast.success(next ? "Restaurant is now open" : "Restaurant is now closed");
    } catch {
      setForm((p) => ({ ...p, open: !next }));
      toast.error("Failed to update restaurant status.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateOwnerRestaurantProfile(form);
      setProfile(updated);
      setForm({
        name: updated.name || "",
        tagline: updated.tagline || "",
        cuisine: updated.cuisine || "Mixed",
        address: updated.address || "",
        phone: updated.phone || "",
        email: updated.email || "",
        deliveryTime: updated.deliveryTime || "25 min",
        minOrder: updated.minOrder ?? 0,
        open: updated.open != null ? updated.open : true,
        logoUrl: updated.logo_url || "",
        bannerUrl: updated.banner_url || "",
      });
      toast.success("Restaurant profile updated!");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-base-content/50 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading restaurant profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <p className="text-center text-base-content/50 py-16">
        Restaurant profile not found.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Restaurant</h1>
        <p className="text-base-content/60 mt-1">
          Update your restaurant logo, banner, name and details.
        </p>
      </div>

      {/* Restaurant header: banner + logo + name */}
      <div className="card bg-base-100 shadow-md overflow-hidden mb-6">
        {form.bannerUrl || profile.banner_url ? (
          <div
            className="h-32 bg-cover bg-center"
            style={{ backgroundImage: `url("${form.bannerUrl || profile.banner_url}")` }}
          />
        ) : (
          <div className="h-32 bg-gradient-to-r from-primary to-secondary" />
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 p-6 -mt-10">
          <div className="w-24 h-24 rounded-2xl bg-base-100 shadow-md border border-base-200 overflow-hidden flex items-center justify-center">
            {form.logoUrl || profile.logo_url ? (
              <img
                src={form.logoUrl || profile.logo_url}
                alt={form.name || profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UtensilsCrossed className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold">
              {form.name || profile.name || "Your Restaurant"}
            </h2>
            <p className="text-base-content/60">
              {(form.cuisine || profile.cuisine) || "Mixed"} •{" "}
              {form.deliveryTime || profile.deliveryTime} delivery
              {form.address || profile.address
                ? ` • ${form.address || profile.address}`
                : ""}
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`btn btn-sm ${form.open ? "btn-success" : "btn-error"}`}
          >
            {form.open ? "● Open Now" : "● Closed"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="card bg-base-100 shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Restaurant Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Restaurant Name</span>
            </label>
            <input
              name="name"
              className="input input-bordered"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Cuisine</span>
            </label>
            <select
              name="cuisine"
              className="select select-bordered"
              value={form.cuisine}
              onChange={handleChange}
            >
              {["Mixed", "Italian", "Fast Food", "Healthy", "Japanese", "Mexican", "Dessert"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control sm:col-span-2">
            <label className="label">
              <span className="label-text">Logo URL</span>
            </label>
            <input
              name="logoUrl"
              className="input input-bordered"
              value={form.logoUrl}
              onChange={handleChange}
              placeholder="https://.../logo.png"
            />
          </div>
          <div className="form-control sm:col-span-2">
            <label className="label">
              <span className="label-text">Banner URL</span>
            </label>
            <input
              name="bannerUrl"
              className="input input-bordered"
              value={form.bannerUrl}
              onChange={handleChange}
              placeholder="https://.../banner.jpg"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tagline</span>
            </label>
            <input
              name="tagline"
              className="input input-bordered"
              value={form.tagline}
              onChange={handleChange}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Address</span>
            </label>
            <input
              name="address"
              className="input input-bordered"
              value={form.address}
              onChange={handleChange}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Phone</span>
            </label>
            <input
              name="phone"
              className="input input-bordered"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              name="email"
              type="email"
              className="input input-bordered"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Delivery Time</span>
            </label>
            <input
              name="deliveryTime"
              className="input input-bordered"
              value={form.deliveryTime}
              onChange={handleChange}
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
              value={form.minOrder}
              onChange={handleChange}
            />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary mt-6 w-fit px-10"
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
};

export default ManageRestaurant;