import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  createOwnerCoupon,
  deleteOwnerCoupon,
  fetchOwnerCoupons,
} from "../../../services/restaurantService";
import { CardGridSkeleton } from "../../../components/dashboard/Skeleton";

const emptyCoupon = {
  code: "",
  discount_type: "percent",
  value: "",
  min_order: "",
  expires_in_days: 7,
  active: true,
};

const Offers = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCoupon);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCoupons(await fetchOwnerCoupons());
    } catch {
      toast.error("Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) {
      toast.error("Code and value are required.");
      return;
    }
    setSaving(true);
    try {
      await createOwnerCoupon({
        code: form.code,
        discount_type: form.discount_type,
        value: parseFloat(form.value),
        min_order: parseFloat(form.min_order || 0),
        expires_in_days: parseInt(form.expires_in_days || 7, 10),
        active: form.active,
      });
      toast.success("Coupon created!");
      setForm(emptyCoupon);
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await deleteOwnerCoupon(id);
      toast.success("Coupon deleted!");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to delete coupon.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Offers / Coupons</h1>
          <p className="text-base-content/60 mt-1">
            Create discount codes your customers can apply at checkout.
          </p>
        </div>
        <button className="btn btn-primary gap-1" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4" />
          New Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card bg-base-100 shadow-md p-6 mb-8">
          <h3 className="font-bold text-lg mb-4">Create Coupon</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Code</span>
              </label>
              <input
                className="input input-bordered uppercase"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="e.g. SAVE10"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Type</span>
              </label>
              <select
                className="select select-bordered"
                value={form.discount_type}
                onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))}
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (৳)</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Value</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input input-bordered"
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                placeholder="10"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Min Order (৳)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input input-bordered"
                value={form.min_order}
                onChange={(e) => setForm((p) => ({ ...p, min_order: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Valid Days</span>
              </label>
              <input
                type="number"
                min="1"
                className="input input-bordered"
                value={form.expires_in_days}
                onChange={(e) => setForm((p) => ({ ...p, expires_in_days: e.target.value }))}
              />
            </div>
            <div className="form-control justify-end">
              <label className="label cursor-pointer justify-start gap-3 mt-6">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={form.active}
                  onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                />
                <span className="label-text">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </span>
              ) : (
                "Create Coupon"
              )}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <CardGridSkeleton count={6} imageHeight="h-32" />
      ) : coupons.length === 0 ? (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center text-base-content/50 py-16">
            No coupons yet. Create your first offer to attract more orders.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div key={c.id} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-extrabold tracking-wide text-primary">
                      {c.code}
                    </p>
                    <p className="text-sm text-base-content/60 mt-1">
                      {c.discount_type === "percent"
                        ? `${c.value}% off`
                        : `${c.value} ৳ off`}
                      {c.min_order > 0 ? ` on orders above ${c.min_order} ৳` : ""}
                    </p>
                  </div>
                  <span className={`badge ${c.active ? "badge-success" : "badge-ghost"}`}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="divider my-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">
                    Valid {c.expires_in_days} days
                  </span>
                  <button
                    className="btn btn-ghost btn-xs text-error gap-1"
                    onClick={() => handleDelete(c.id, c.code)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Offers;