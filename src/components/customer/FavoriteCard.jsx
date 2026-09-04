import { Heart, Star } from "lucide-react";
import { FoodPhoto } from "../admin/SmartImage";

const FavoriteCard = ({ item, onToggle }) => (
  <div className="flex items-center gap-3">
    <FoodPhoto src={item.image} alt={item.name} className="h-12 w-12 rounded-xl" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-base-content/90">{item.name}</p>
      <div className="mt-0.5 flex items-center gap-2 text-xs">
        <span className="flex items-center gap-1 font-semibold text-base-content/80">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {item.rating || "4.5"}
        </span>
        <span className="text-base-content/40">{item.cuisine || item.category || "Food"}</span>
      </div>
    </div>
    <button
      onClick={() => onToggle?.(item)}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-base-300/60 bg-base-200 text-error transition-colors hover:bg-error/10"
      aria-label={`Remove ${item.name} from favorites`}
    >
      <Heart className="h-4 w-4 fill-error" />
    </button>
  </div>
);

export default FavoriteCard;