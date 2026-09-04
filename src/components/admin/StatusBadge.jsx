const BASE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

const STYLES = {
  // Order statuses
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-sky-100 text-sky-700",
  Preparing: "bg-violet-100 text-violet-700",
  "Ready for Pickup": "bg-cyan-100 text-cyan-700",
  "On the Way": "bg-blue-100 text-blue-700",
  Delivered: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
  // Payment
  Paid: "bg-emerald-100 text-emerald-700",
  Unpaid: "bg-rose-100 text-rose-700",
  COD: "bg-slate-100 text-slate-600",
  bkash: "bg-pink-100 text-pink-700",
  Card: "bg-indigo-100 text-indigo-700",
  // Accounts
  Active: "bg-emerald-100 text-emerald-700",
  active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-600",
  inactive: "bg-slate-100 text-slate-600",
  Online: "bg-emerald-100 text-emerald-700",
  Offline: "bg-slate-100 text-slate-600",
  // Verification
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-rose-100 text-rose-700",
};

const StatusBadge = ({ status = "" }) => {
  const key = typeof status === "string" ? status : String(status || "");
  const style = STYLES[key] || STYLES[key.toLowerCase()] || "bg-slate-100 text-slate-600";
  return <span className={`${BASE} ${style}`}>{key || "—"}</span>;
};

export default StatusBadge;