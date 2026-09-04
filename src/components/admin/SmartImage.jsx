import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";

// Image with a graceful fallback when the URL is missing or fails to load.
// Parents may pass their own `fallback` node, otherwise a neutral tile is shown.
export const SmartImage = ({ src, alt = "", className = "", fallback = null }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={`flex items-center justify-center bg-base-200 text-base-content/50 ${className}`}>—</div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

// Rounded avatar with an initials-based fallback.
export const Avatar = ({ src, name = "", className = "h-10 w-10" }) => {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <SmartImage
      src={src}
      alt={name}
      className={`${className} shrink-0 rounded-full object-cover`}
      fallback={
        <div
          className={`${className} flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary`}
        >
          {initial}
        </div>
      }
    />
  );
};

// Food / restaurant photo with a fork-knife placeholder.
export const FoodPhoto = ({ src, alt = "", className = "" }) => (
  <SmartImage
    src={src}
    alt={alt}
    className={`shrink-0 object-cover ${className}`}
    fallback={
      <div
        className={`${className} flex shrink-0 items-center justify-center bg-base-200 text-base-content/30`}
      >
        <UtensilsCrossed className="h-5 w-5" />
      </div>
    }
  />
);