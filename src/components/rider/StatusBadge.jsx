// Colorful status pill for deliveries (rider_status + order status).
const STYLES = {
  Accepted: "bg-sky-500/10 text-sky-600 ring-sky-500/20",
  "At Restaurant": "bg-violet-500/10 text-violet-600 ring-violet-500/20",
  "Picked Up": "bg-blue-500/10 text-blue-600 ring-blue-500/20",
  "On The Way": "bg-amber-500/10 text-amber-600 ring-amber-500/20",
  Delivered: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  Cancelled: "bg-rose-500/10 text-rose-600 ring-rose-500/20",
  Pending: "bg-base-300/40 text-base-content/60 ring-base-300/40",
  Preparing: "bg-orange-500/10 text-orange-600 ring-orange-500/20",
};

const DOTS = {
  Accepted: "bg-sky-500",
  "At Restaurant": "bg-violet-500",
  "Picked Up": "bg-blue-500",
  "On The Way": "bg-amber-500",
  Delivered: "bg-emerald-500",
  Cancelled: "bg-rose-500",
  Pending: "bg-base-content/40",
  Preparing: "bg-orange-500",
};

const StatusBadge = ({ status = "", dot = true }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
      STYLES[status] || "bg-base-200 text-base-content/60 ring-base-300"
    }`}
  >
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status] || "bg-base-content/40"}`} />}
    {status || "—"}
  </span>
);

export default StatusBadge;