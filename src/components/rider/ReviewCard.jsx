import { Quote, Star } from "lucide-react";
import { Avatar } from "../admin/SmartImage";
import { timeAgo } from "./shared";

const ReviewCard = ({ review }) => (
  <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <Avatar src={null} name={review.customer} className="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-base-content">{review.customer}</p>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-3.5 w-3.5 ${
                  n <= Math.round(review.rating) ? "fill-amber-400 text-amber-400" : "text-base-300"
                }`}
              />
            ))}
          </span>
          <span className="text-xs text-base-content/40">{timeAgo(review.date)}</span>
        </div>
      </div>
      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600">
        {Number(review.rating || 0).toFixed(1)}
      </span>
    </div>

    {review.comment && (
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-base-200/50 p-3 text-sm text-base-content/80">
        <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 rotate-180 text-base-content/30" />
        {review.comment}
      </p>
    )}
    {!review.comment && (
      <p className="mt-3 text-xs text-base-content/40">No written comment.</p>
    )}
  </div>
);

export default ReviewCard;