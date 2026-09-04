import { CheckCircle2, Loader2 } from "lucide-react";

// Horizontal 4-step delivery tracker: Accepted -> Picked Up -> On The Way -> Delivered.
const STEPS = ["Accepted", "Picked Up", "On The Way", "Delivered"];

const stepState = (current, delivered) => {
  if (delivered) {
    return STEPS.map((s) => (s === "Delivered" ? "current" : "done"));
  }
  const idx = STEPS.indexOf(current);
  if (idx < 0) return STEPS.map((s, i) => (i === 0 ? "current" : "pending"));
  return STEPS.map((s, i) =>
    i < idx ? "done" : i === idx ? "current" : "pending",
  );
};

const DeliveryProgress = ({ current = "Accepted", delivered = false, busy }) => {
  const states = stepState(current, delivered);

  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const st = states[i];
        const isLast = i === STEPS.length - 1;
        return (
          <div key={s} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            {/* Node */}
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                  st === "done"
                    ? "border-primary bg-primary text-primary-content"
                    : st === "current"
                      ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/20"
                      : "border-base-300 bg-base-100 text-base-content/40"
                }`}
              >
                {busy && st === "current" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : st === "done" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  st === "current" && <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </span>
              <span
                className={`whitespace-nowrap text-[10px] font-semibold ${
                  st === "pending" ? "text-base-content/40" : "text-base-content"
                }`}
              >
                {s}
              </span>
            </div>
            {/* Connector */}
            {!isLast && (
              <div className="mx-2 mb-5 h-0.5 flex-1 rounded-full bg-base-300">
                <div
                  className={`h-full rounded-full bg-primary transition-all ${
                    states[i + 1] === "done" ? "w-full" : states[i + 1] === "current" ? "w-1/2" : "w-0"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DeliveryProgress;