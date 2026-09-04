import { Banknote, CreditCard, Smartphone, Ellipsis } from "lucide-react";
import DashboardCard from "./DashboardCard";

const ICONS = {
  cash: { Icon: Banknote, color: "bg-success/10 text-success" },
  card: { Icon: CreditCard, color: "bg-primary/10 text-primary" },
  mobile: { Icon: Smartphone, color: "bg-secondary/10 text-secondary" },
  other: { Icon: Ellipsis, color: "bg-base-200 text-base-content/50" },
};

const OrderTypesCard = ({ data }) => {
  const list = Array.isArray(data) ? data : [];
  return (
    <DashboardCard title="Payment Methods" subtitle="How customers pay for orders">
      {list.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-base-content/50">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((t) => {
            const meta = ICONS[t.iconKey] || ICONS.other;
            const Icon = meta.Icon;
            return (
              <div key={t.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-base-content/70">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {t.name}
                  </span>
                  <span className="font-semibold text-base-content">{t.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-base-200">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${t.value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
};

export default OrderTypesCard;