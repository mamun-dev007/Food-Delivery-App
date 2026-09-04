import { Bike, Loader2, Power } from "lucide-react";

// Large availability card. The active-delivery warning + confirmation is
// handled by the parent page via ConfirmDialog; this just flips the switch.
const OnlineStatusToggle = ({ isOnline, busy, onToggle }) => (
  <div
    className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
      isOnline
        ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50"
        : "border-base-300 bg-base-100"
    }`}
  >
    <div className="flex items-center justify-between gap-3 sm:gap-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${
            isOnline ? "bg-emerald-500/15 text-emerald-600" : "bg-base-200 text-base-content/40"
          }`}
        >
          <Bike className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-base font-bold text-base-content sm:text-lg">
            <span
              className={`relative flex h-2.5 w-2.5 shrink-0 ${
                isOnline ? "text-emerald-500" : "text-base-content/40"
              }`}
            >
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${
                  isOnline ? "animate-ping bg-emerald-400" : "bg-base-content/30"
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-base-content/40"
                }`}
              />
            </span>
            <span className="truncate">You are {isOnline ? "Online" : "Offline"}</span>
          </p>
          <p className="truncate text-xs text-base-content/60 sm:text-sm">
            {isOnline
              ? "New orders will be offered to you in real time."
              : "Go online to start receiving delivery requests."}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={busy}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors disabled:opacity-60 sm:gap-2 sm:px-4 sm:text-sm ${
          isOnline
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-primary text-primary-content hover:bg-primary-focus"
        }`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Power className="h-4 w-4" />
        )}
        <span className="whitespace-nowrap">{isOnline ? "Go Offline" : "Go Online"}</span>
      </button>
    </div>
  </div>
);

export default OnlineStatusToggle;