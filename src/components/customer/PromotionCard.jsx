import toast from "react-hot-toast";

const PromotionCard = ({ code, description, onApply }) => (
  <div className="rounded-xl border border-dashed border-primary/40 bg-primary/10 px-3 py-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-wide text-primary">{code}</p>
        <p className="mt-0.5 text-xs leading-snug text-base-content/60">{description}</p>
      </div>
      <button
        onClick={() => {
          if (onApply) onApply(code);
          else toast.success(`${code} applied!`);
        }}
        className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-content transition-colors hover:bg-primary-focus"
      >
        Apply
      </button>
    </div>
  </div>
);

export default PromotionCard;