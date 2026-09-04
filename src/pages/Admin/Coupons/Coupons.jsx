import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";
import { CardGridSkeleton } from "../../../components/dashboard/Skeleton";

const Coupons = () => {
  const coupons = useAdminStore((s) => s.coupons);
  const couponsLoading = useAdminStore((s) => s.couponsLoading);
  const loadCoupons = useAdminStore((s) => s.loadCoupons);
  const addCoupon = useAdminStore((s) => s.addCoupon);
  const deleteCoupon = useAdminStore((s) => s.deleteCoupon);

  const [form, setForm] = useState({
    code: "",
    type: "Percentage",
    value: "",
    description: "",
    max_usage: "",
    expires: "",
  });

  useEffect(() => {
    loadCoupons().catch(() => toast.error("Could not load coupons"));
  }, [loadCoupons]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    try {
      await addCoupon({
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value || 0),
        description: form.description.trim(),
        max_usage: parseFloat(form.max_usage || 0),
        expires: form.expires || null,
      });
      toast.success("Coupon created!");
      setForm({ code: "", type: "Percentage", value: "", description: "", max_usage: "", expires: "" });
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Could not create coupon");
    }
  };

  const handleDelete = async (id, code) => {
    try {
      await deleteCoupon(id);
      toast.success(`Coupon ${code} deleted`);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Could not delete coupon");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Coupons / Offers</h1>
      <p className="text-base-content/60 mt-1 mb-6">
        Create and manage promotional coupons.
      </p>

      <form onSubmit={handleAdd} className="card bg-base-100 shadow-md p-5 mb-6">
        <h2 className="text-lg font-bold mb-3">Create Coupon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            name="code"
            className="input input-bordered"
            placeholder="CODE"
            value={form.code}
            onChange={handleChange}
            required
          />
          <select
            name="type"
            className="select select-bordered"
            value={form.type}
            onChange={handleChange}
          >
            <option>Percentage</option>
            <option>Free Delivery</option>
            <option>Flat Amount</option>
          </select>
          <input
            name="value"
            type="number"
            className="input input-bordered"
            placeholder={form.type === "Free Delivery" ? "Value (0)" : "Value"}
            value={form.value}
            onChange={handleChange}
          />
          <input
            name="description"
            className="input input-bordered"
            placeholder="Description (e.g. 20% off your order)"
            value={form.description}
            onChange={handleChange}
          />
          <input
            name="max_usage"
            type="number"
            className="input input-bordered"
            placeholder="Max usage (0 = unlimited)"
            value={form.max_usage}
            onChange={handleChange}
          />
          <input
            name="expires"
            type="date"
            className="input input-bordered"
            value={form.expires}
            onChange={handleChange}
          />
        </div>
        <button className="btn btn-primary gap-1 mt-4">
          <Plus className="w-4 h-4" />
          Add Coupon
        </button>
      </form>

      <div className="card bg-base-100 shadow-md overflow-x-auto">
        {couponsLoading ? (
          <CardGridSkeleton count={6} imageHeight="h-32" />
        ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Description</th>
              <th>Usage</th>
              <th>Expires</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-base-content/50 py-8">
                  No coupons yet. Create one above.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id}>
                  <td>
                    <code className="px-3 py-1 bg-base-200 rounded-lg font-bold">
                      {c.code}
                    </code>
                  </td>
                  <td>{c.type}</td>
                  <td>
                    {c.type === "Percentage" ? `${c.value}%` : c.type === "Flat Amount" ? `$${c.value}` : "—"}
                  </td>
                  <td className="max-w-[220px] truncate text-base-content/70">
                    {c.description || "—"}
                  </td>
                  <td>
                    {c.usage}
                    {c.max_usage ? ` / ${c.max_usage}` : ""}
                  </td>
                  <td>{c.expires ? new Date(c.expires).toLocaleDateString() : "Never"}</td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      className="btn btn-ghost btn-sm text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default Coupons;
