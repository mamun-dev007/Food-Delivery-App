import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Avatar } from "../admin/SmartImage";
import StatusBadge from "./StatusBadge";
import { fmtDate, fmtMoney } from "./shared";
import EmptyState from "./EmptyState";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
];

const DeliveryHistoryTable = ({
  rows = [],
  total = 0,
  page = 1,
  pages = 1,
  limit = 8,
  loading = false,
  onPageChange,
  onSearch,
  onStatus,
  onDate,
}) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const t = setTimeout(() => onSearch && onSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    onStatus && onStatus(status);
  }, [status]);

  useEffect(() => {
    onDate && onDate(date);
  }, [date]);

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-base-300 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, restaurant…"
            className="w-full rounded-xl border border-base-300 bg-base-100 py-2.5 pl-9 pr-9 text-sm text-base-content outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-base-300 bg-base-100 px-3 py-2.5 text-sm text-base-content outline-none focus:border-primary"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-base-300 bg-base-100 py-2.5 pl-9 pr-3 text-sm text-base-content outline-none focus:border-primary"
          />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-base-300 bg-base-200/50 text-xs uppercase tracking-wide text-base-content/50">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Restaurant</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Distance</th>
              <th className="px-4 py-3 font-semibold">Earnings</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2].map((i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-10 animate-pulse rounded-lg bg-base-200" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="No deliveries found"
                    message="Try changing the search or filters."
                    className="border-0"
                  />
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-base-200 last:border-0 hover:bg-base-200/40">
                  <td className="px-4 py-3.5 font-bold text-primary">{r.order_no}</td>
                  <td className="px-4 py-3.5 font-medium text-base-content">{r.restaurant}</td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-2">
                      <Avatar src={null} name={r.customer} className="h-7 w-7 text-[11px]" />
                      <span className="text-base-content/80">{r.customer}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-base-content/70">{r.distance_km} km</td>
                  <td className="px-4 py-3.5 font-bold text-emerald-600">{fmtMoney(r.earnings)}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={r.status === "Cancelled" ? "Cancelled" : "Delivered"} />
                  </td>
                  <td className="px-4 py-3.5 text-base-content/60">{fmtDate(r.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 px-4 py-3 text-sm text-base-content/60">
        <span>
          Showing <b className="text-base-content">{from}–{to}</b> of{" "}
          <b className="text-base-content">{total}</b>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-base-300 text-base-content/70 transition-colors hover:bg-base-200 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pages)
            .reduce((acc, p) => (acc.includes(p) ? acc : [...acc, p]), [])
            .map((p, i, arr) => (
              <span key={p} className="flex items-center gap-1.5">
                {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-base-content/40">…</span>}
                <button
                  onClick={() => onPageChange(p)}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors ${
                    p === page ? "bg-primary text-primary-content" : "border border-base-300 text-base-content/70 hover:bg-base-200"
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages || loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-base-300 text-base-content/70 transition-colors hover:bg-base-200 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryHistoryTable;