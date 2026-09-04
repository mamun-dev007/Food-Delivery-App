import { Trophy } from "lucide-react";

const AchievementCard = ({ name = "Rider", rating = 0 }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 text-amber-500 ring-1 ring-amber-200">
      <Trophy className="h-7 w-7" />
    </span>
    <div className="min-w-0">
      <p className="text-base font-bold text-base-content">
        Great job, {name || "champ"}! 🎉
      </p>
      <p className="mt-0.5 text-sm leading-snug text-base-content/60">
        You're doing awesome! {rating > 0 ? `Holding a ${rating}★ rating. ` : ""}
        Keep up the good work and earn more bonuses.
      </p>
    </div>
  </div>
);

export default AchievementCard;