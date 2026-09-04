import { useEffect, useState } from "react";
import { CreditCard, Plus, Trash2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  loadPaymentMethods,
  savePaymentMethods,
} from "../../../services/customerService";
import CustomerEmptyState from "../../../components/customer/EmptyState";

const EMPTY_FORM = { type: "card", number: "", expiry: "", name: "" };

const PaymentMethods = () => {
  const [methods, setMethods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setMethods(loadPaymentMethods());
  }, []);

  const persist = (next) => {
    setMethods(next);
    savePaymentMethods(next);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const digits = form.number.replace(/\s/g, "");
    if (digits.length < 12 || !form.expiry || !form.name.trim()) {
      toast.error("Please fill in a valid card number, expiry and name.");
      return;
    }
    persist([
      ...methods,
      {
        ...form,
        number: digits,
        id: `pay-${Date.now()}`,
        isDefault: methods.length === 0,
      },
    ]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    toast.success("Payment method added.");
  };

  const handleDelete = (id) => {
    persist(methods.filter((m) => m.id !== id));
    toast.success("Payment method removed.");
  };

  const handleDefault = (id) => {
    persist(methods.map((m) => ({ ...m, isDefault: m.id === id })));
    toast.success("Default payment method updated.");
  };

  const inputCls =
    "w-full rounded-xl border border-base-300 bg-base-100 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-base-content/40 focus:border-primary";

  return (
    <div className="mx-auto w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            Payment Methods
          </h1>
          <p className="text-sm text-base-content/50">
            Saved cards for quicker checkout. Stored only on this device.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-focus"
        >
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add Card"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-6 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
        >
          <h2 className="mb-4 text-sm font-bold text-base-content">New Card</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-base-content/60">
                Cardholder Name
              </label>
              <input
                className={inputCls}
                placeholder="Name on card"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-base-content/60">
                Card Number
              </label>
              <input
                className={inputCls}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                value={form.number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    number: e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 16)
                      .replace(/(.{4})/g, "$1 ")
                      .trim(),
                  })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-base-content/60">
                Expiry Date
              </label>
              <input
                className={inputCls}
                placeholder="MM/YY"
                value={form.expiry}
                onChange={(e) => setForm({ ...form, expiry: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-content hover:bg-primary-focus"
            >
              Save Card
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="rounded-xl border border-base-300 px-5 py-2.5 text-sm font-semibold text-base-content/70 hover:bg-base-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {methods.length === 0 ? (
        <CustomerEmptyState
          icon={CreditCard}
          title="No payment methods saved"
          message="Cards are kept private to this device. In most cases you can also pay cash on delivery."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content"
            >
              Add a Card
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div
              key={m.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-base-100 p-4 shadow-sm ${
                m.isDefault ? "border-primary/50" : "border-base-300"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-base-content">
                    •••• •••• •••• {m.number.slice(-4)}
                  </p>
                  <p className="text-sm text-base-content/60">
                    {m.name} · Expires {m.expiry}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {m.isDefault ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Default
                  </span>
                ) : (
                  <button
                    onClick={() => handleDefault(m.id)}
                    className="rounded-lg border border-base-300 px-3 py-1.5 text-xs font-semibold text-base-content/70 hover:bg-base-200"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m.id)}
                  className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;