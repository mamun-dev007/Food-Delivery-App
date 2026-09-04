import { Inbox } from "lucide-react";

const EmptyState = ({ title = "Nothing here yet", message, action }) => (
  <div className="rounded-2xl border border-base-300 bg-base-100 px-6 py-16 text-center">
    <Inbox className="mx-auto h-10 w-10 text-base-content/30" />
    <p className="mt-3 text-sm font-semibold text-base-content">{title}</p>
    {message && <p className="mt-1 text-sm text-base-content/50">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;