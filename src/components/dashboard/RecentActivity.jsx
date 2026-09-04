import { ShoppingBag, Star, CheckCircle2, UserPlus, Utensils, Bell } from "lucide-react";
import DashboardCard from "./DashboardCard";

const TYPE_ICONS = {
  order: { Icon: ShoppingBag, color: "bg-primary/10 text-primary" },
  review: { Icon: Star, color: "bg-warning/10 text-warning" },
  delivered: { Icon: CheckCircle2, color: "bg-success/10 text-success" },
  progress: { Icon: CheckCircle2, color: "bg-info/10 text-info" },
  customer: { Icon: UserPlus, color: "bg-secondary/10 text-secondary" },
  menu: { Icon: Utensils, color: "bg-primary/10 text-primary" },
  info: { Icon: Bell, color: "bg-base-200 text-base-content/60" },
};

function relTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const RecentActivity = ({ items }) => (
  <DashboardCard title="Recent Activity" subtitle="Latest happenings at your restaurant">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {(items || []).slice(0, 6).map((a, idx) => {
        const meta = TYPE_ICONS[a.type] || TYPE_ICONS.info;
        const Icon = meta.Icon;
        return (
          <div
            key={a.id || idx}
            className="flex items-start gap-3 rounded-xl border border-base-200 bg-base-200/60 p-3"
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-base-content/80">{a.message}</p>
              <p className="mt-0.5 text-xs text-base-content/50">{relTime(a.time)}</p>
            </div>
          </div>
        );
      })}
    </div>
  </DashboardCard>
);

export default RecentActivity;