import { Calendar } from "lucide-react";

const DEFAULT_RANGES = ["This Week", "This Month", "This Year", "Last 30 Days"];

const DateRangePicker = ({ value, onChange, options, compact = false }) => {
  const ranges = options || DEFAULT_RANGES;
  return (
    <div
      className={`flex items-center gap-1 rounded-xl border border-primary bg-primary/5 p-1 shadow-sm ${
        compact ? "" : "min-w-[210px]"
      }`}
    >
      <span className={`pl-2 text-primary ${compact ? "hidden sm:inline-flex" : ""}`}>
        <Calendar className="h-4 w-4" />
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-transparent text-sm font-semibold text-primary outline-none ${
          compact ? "w-full px-2 py-1.5" : "w-full px-2 py-1.5"
        }`}
        aria-label="Date range"
      >
        {ranges.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DateRangePicker;