import { AlertTriangle, X } from "lucide-react";

// Lightweight confirmation dialog.
const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", tone = "primary", busy = false, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-base-content/50 hover:bg-base-200"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-base-content">{title}</h3>
        <p className="mt-1.5 text-sm text-base-content/60">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-base-300 px-4 py-2.5 text-sm font-semibold text-base-content hover:bg-base-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-60 ${
              tone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-primary hover:bg-primary-focus"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;