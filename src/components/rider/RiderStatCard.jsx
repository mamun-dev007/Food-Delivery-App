import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

const TINTS = {
  blue: "bg-blue-500/10 text-blue-600",
  green: "bg-emerald-500/10 text-emerald-600",
  orange: "bg-orange-500/10 text-orange-600",
  purple: "bg-[#570df8]/10 text-[#570df8]",
  pink: "bg-[#f000b8]/10 text-[#f000b8]",
  amber: "bg-amber-500/10 text-amber-600",
  rose: "bg-rose-500/10 text-rose-600",
  sky: "bg-sky-500/10 text-sky-600",
};

const RiderStatCard = ({
  label,
  value,
  icon: Icon,
  tint = "purple",
  delta,
  deltaType = "up",
  sub,
  loading = false,
}) => (
  <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-base-content/60">{label}</p>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${TINTS[tint] || TINTS.purple}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>

    {loading ? (
      <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-base-200" />
    ) : (
      <p className="mt-2 text-2xl font-bold tracking-tight text-base-content">{value}</p>
    )}

    <div className="mt-1 flex items-center gap-1.5">
      {delta && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            deltaType === "up"
              ? "bg-emerald-500/10 text-emerald-600"
              : deltaType === "down"
                ? "bg-rose-500/10 text-rose-600"
                : "bg-base-200 text-base-content/50"
          }`}
        >
          {deltaType === "up" ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : deltaType === "down" ? (
            <ArrowDownRight className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          {delta}
        </span>
      )}
      {sub && <span className="text-[11px] text-base-content/50">{sub}</span>}
    </div>
  </div>
);

export default RiderStatCard;