import { useEffect } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminStore } from "../../../store/adminStore";
import { ListSkeleton } from "../../../components/dashboard/Skeleton";

const RestaurantRequests = () => {
  const requests = useAdminStore((s) => s.restaurantRequests);
  const loading = useAdminStore((s) => s.requestsLoading);
  const loadRequests = useAdminStore((s) => s.loadRequests);
  const reviewRequest = useAdminStore((s) => s.reviewRequest);

  useEffect(() => {
    loadRequests().catch((err) =>
      toast.error(err?.message || "Could not load requests.")
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReview = async (id, action) => {
    try {
      await reviewRequest(id, action);
      toast.success(
        action === "approve"
          ? "Restaurant approved."
          : "Restaurant rejected."
      );
    } catch (err) {
      toast.error(err?.message || "Action failed.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Requests</h1>
          <p className="text-base-content/60 mt-1">
            Review and approve restaurants waiting for verification.
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm gap-1"
          onClick={() =>
            loadRequests().catch((err) =>
              toast.error(err?.message || "Could not load requests.")
            )
          }
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : requests.length === 0 ? (
        <div className="card bg-base-100 shadow-md p-10 text-center text-base-content/60">
          No restaurant requests pending review.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {r.avatar_url ? (
                      <img
                        src={r.avatar_url}
                        alt={r.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center font-bold">
                        {r.name?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <h2 className="font-bold text-lg">{r.name}</h2>
                      <p className="text-sm text-base-content/60">
                        {r.email} · {r.phone || "no phone"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      r.status === "rejected" ? "badge-error" : "badge-warning"
                    }`}
                  >
                    {r.status === "rejected" ? "Rejected" : "Pending"}
                  </span>
                </div>

                {r.restaurant && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-2">
                    <div>
                      <span className="text-base-content/50">Restaurant:</span>{" "}
                      <span className="font-semibold">{r.restaurant.name}</span>
                    </div>
                    <div>
                      <span className="text-base-content/50">Cuisine:</span>{" "}
                      {r.restaurant.cuisine || "—"}
                    </div>
                    <div>
                      <span className="text-base-content/50">City/Area:</span>{" "}
                      {[r.restaurant.city, r.restaurant.area]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </div>
                    <div>
                      <span className="text-base-content/50">Address:</span>{" "}
                      {r.restaurant.address || "—"}
                    </div>
                    <div>
                      <span className="text-base-content/50">Phone:</span>{" "}
                      {r.restaurant.phone || "—"}
                    </div>
                    <div>
                      <span className="text-base-content/50">Delivery:</span>{" "}
                      {r.restaurant.delivery_available ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="text-base-content/50">Hours:</span>{" "}
                      {r.restaurant.opening_time || "—"} -{" "}
                      {r.restaurant.closing_time || "—"}
                    </div>
                    <div>
                      <span className="text-base-content/50">
                        Trade License:
                      </span>{" "}
                      {r.restaurant.trade_license || "—"}
                    </div>
                  </div>
                )}

                <div className="card-actions justify-end mt-2">
                  <button
                    className="btn btn-success btn-sm gap-1"
                    onClick={() => handleReview(r.id, "approve")}
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    className="btn btn-error btn-sm gap-1"
                    onClick={() => handleReview(r.id, "reject")}
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantRequests;
