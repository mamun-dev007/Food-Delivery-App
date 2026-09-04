import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Plus, Edit2, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";
import {
  loadAddresses,
  saveAddresses,
} from "../../../services/customerService";
import CustomerEmptyState from "../../../components/customer/EmptyState";

const EMPTY_FORM = { label: "Home", address: "", city: "", phone: "" };

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setAddresses(loadAddresses());
  }, []);

  const persist = (next) => {
    setAddresses(next);
    saveAddresses(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.address.trim() || !form.city.trim()) {
      toast.error("Please fill in the address and city.");
      return;
    }
    if (editingId) {
      persist(addresses.map((a) => (a.id === editingId ? { ...a, ...form } : a)));
      toast.success("Address updated.");
    } else {
      persist([...addresses, { ...form, id: `addr-${Date.now()}` }]);
      toast.success("Address added.");
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    persist(addresses.filter((a) => a.id !== id));
    toast.success("Address removed.");
  };

  const setDefault = (id) => {
    persist(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    toast.success("Default address updated.");
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setForm({ label: a.label, address: a.address, city: a.city, phone: a.phone || "" });
    setShowForm(true);
  };

  const inputCls =
    "w-full rounded-xl border border-base-300 bg-base-100 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-base-content/40 focus:border-primary";

  return (
    <div className="mx-auto w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">Addresses</h1>
          <p className="text-sm text-base-content/50">
            Delivery addresses used at checkout. Saved on this device.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm(EMPTY_FORM);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus"
        >
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add Address"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
        >
          <h2 className="mb-4 text-sm font-bold text-base-content">
            {editingId ? "Edit Address" : "New Address"}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-base-content/60">Label</label>
              <select
                className={inputCls}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              >
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-base-content/60">Phone</label>
              <input
                type="tel"
                className={inputCls}
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-base-content/60">Address</label>
              <input
                className={inputCls}
                placeholder="House, road, area"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-base-content/60">City</label>
              <input
                className={inputCls}
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-focus">
              {editingId ? "Save Changes" : "Save Address"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
              className="rounded-xl border border-base-300 px-5 py-2.5 text-sm font-semibold text-base-content/70 hover:bg-base-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <CustomerEmptyState
          icon={MapPin}
          title="No saved addresses"
          message="Add a delivery address so checkout is faster. Your addresses are private to you on this device."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content"
            >
              Add Your First Address
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border bg-base-100 p-5 shadow-sm ${
                a.isDefault ? "border-primary/50" : "border-base-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {a.label}
                    </span>
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                        <Check className="h-3 w-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-semibold text-base-content">{a.address}</p>
                  <p className="text-sm text-base-content/60">{a.city}</p>
                  {a.phone && <p className="text-sm text-base-content/60">{a.phone}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-base-200 pt-3">
                {!a.isDefault && (
                  <button
                    onClick={() => setDefault(a.id)}
                    className="rounded-lg border border-base-300 px-3 py-1.5 text-xs font-semibold text-base-content/70 hover:bg-base-200"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => startEdit(a)}
                  className="flex items-center gap-1 rounded-lg border border-base-300 px-3 py-1.5 text-xs font-semibold text-base-content/70 hover:bg-base-200"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-base-content/40">
        Want a fresh start? <Link to="/menu" className="font-semibold text-primary hover:underline">Browse restaurants</Link>
      </p>
    </div>
  );
};

export default Addresses;