import { Bike, CheckCheck, Package, PartyPopper, ShieldAlert } from "lucide-react";

export const notificationIcon = (type) =>
  type === "delivery"
    ? { icon: Package, tint: "bg-emerald-500/10 text-emerald-600" }
    : type === "progress"
      ? { icon: Bike, tint: "bg-sky-500/10 text-sky-600" }
      : type === "cancel"
        ? { icon: ShieldAlert, tint: "bg-rose-500/10 text-rose-600" }
        : type === "campaign"
          ? { icon: PartyPopper, tint: "bg-amber-500/10 text-amber-600" }
          : { icon: CheckCheck, tint: "bg-primary/10 text-primary" };