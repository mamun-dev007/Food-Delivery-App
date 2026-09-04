import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";
import { Avatar } from "./SmartImage";

const RecentUsers = ({ users = [], className = "" }) => (
  <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-base-content">Recently Joined</h3>
      </div>
      <Link
        to="/admin/customers"
        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary"
      >
        View all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>

    <div className="mt-4 space-y-3">
      {users.length === 0 && (
        <p className="py-6 text-center text-sm text-base-content/50">No users yet</p>
      )}
      {users.slice(0, 6).map((u, i) => {
        const joined = u.created_at ? new Date(u.created_at).toLocaleDateString() : "";
        return (
          <div key={u._id || i} className="flex items-center gap-3">
            <Avatar src={u.avatar_url} name={u.name} className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-base-content">{u.name}</p>
              <p className="truncate text-xs text-base-content/50">
                {u.email || u.phone || "—"} · Joined {joined}
              </p>
            </div>
            <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-medium capitalize text-base-content/60">
              {u.role || "customer"}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

export default RecentUsers;