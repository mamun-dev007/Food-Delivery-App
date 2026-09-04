import { Check, Truck } from "lucide-react";
import { ORDER_STEPS, trackerIndex } from "../../utils/orderStatus";

// Horizontal 5-step delivery tracker with the current status highlighted.
const OrderStatusTracker = ({ status, compact = false }) => {
  const current = trackerIndex(status);

  if (current < 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-error/15 px-3 py-2 text-xs font-semibold text-error">
        <span className="h-1.5 w-1.5 rounded-full bg-error" />
        This order was cancelled.
      </div>
    );
  }

  const dotSize = compact ? "h-2 w-2" : "h-2.5 w-2.5";
  const lastIdx = ORDER_STEPS.length - 1;

  return (
    <div className={compact ? "mt-3" : "mt-5"}>
      <div className="flex items-start">
        {ORDER_STEPS.map((step, idx) => {
          const done = idx < current;
          const isCurrent = idx === current;
          const isLast = idx === lastIdx;
          const isDone = done || (isCurrent && current === lastIdx);
          return (
            <div key={step} className={isLast ? "flex-none" : "flex flex-1 items-center"}>
              <div className="flex flex-col items-center">
                <span
                  className={`flex ${compact ? "h-6 w-6" : "h-8 w-8"} shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isDone || (isCurrent && current === lastIdx)
                      ? "border-primary bg-primary text-primary-content"
                      : isCurrent
                        ? "border-primary bg-base-100 text-primary"
                        : "border-base-300 bg-base-100 text-base-content/30"
                  }`}
                >
                  {isDone || (isCurrent && current === lastIdx) ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrent ? (
                    <span className={`${dotSize} animate-pulse rounded-full bg-primary`} />
                  ) : (
                    <span className={`${dotSize} rounded-full bg-base-300`} />
                  )}
                </span>
                <span
                  className={`mt-1.5 text-center font-semibold leading-tight ${
                    compact ? "hidden" : "hidden text-[10px] sm:block"
                  } ${
                    isCurrent
                      ? "text-primary"
                      : isDone
                        ? "text-base-content/70"
                        : "text-base-content/30"
                  }`}
                >
                  {step}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`mx-1 mb-0 h-0.5 flex-1 rounded-full ${
                    idx < current ? "bg-primary" : isCurrent ? "bg-primary/40" : "bg-base-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Truck className="h-3.5 w-3.5" />
          {current === ORDER_STEPS.length - 1
            ? "Delivered — enjoy your meal!"
            : `Currently: ${ORDER_STEPS[current]}`}
        </p>
      )}
    </div>
  );
};

export default OrderStatusTracker;