import { Gift } from "lucide-react";

// Weekly bonus ring. Progress = deliveries completed this week vs a 25-target,
// and the "earned" amount is the real weekly earnings (no fake numbers).
const WeeklyBonus = ({ weekDeliveries = 0, weekEarnings = 0, target = 25, loading = false }) => {
  const pct = Math.max(0, Math.min(100, Math.round((weekDeliveries / target) * 100)));
  const remaining = Math.max(0, target - weekDeliveries);
  const SIZE = 92;
  const R = (SIZE - 12) / 2;
  const C = 2 * Math.PI * R;

  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600">
          <Gift className="h-4 w-4" />
        </span>
        <h3 className="text-base font-bold text-orange-700">Weekly Bonus</h3>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative h-[92px] w-[92px] shrink-0">
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="hsl(var(--bc) / 0.08)"
              strokeWidth="10"
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="#f97316"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C - (C * pct) / 100}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-orange-600">{loading ? "…" : `${pct}%`}</span>
            <span className="text-[10px] text-orange-500/70">{loading ? "" : "progress"}</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-extrabold tracking-tight text-orange-600">
            ৳{Number(weekEarnings || 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs leading-snug text-orange-700/80">
            {remaining > 0
              ? `Complete ${remaining} more deliveries to unlock this week's bonus`
              : "Bonus unlocked! Keep it rolling 🎉"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyBonus;