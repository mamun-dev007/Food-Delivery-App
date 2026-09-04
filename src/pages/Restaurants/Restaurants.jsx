import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock } from "lucide-react";
import { fetchRestaurants } from "../../services/restaurantPublicService";
import { CardGridSkeleton } from "../../components/dashboard/Skeleton";

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchRestaurants()
      .then((list) => {
        if (active) setRestaurants(list);
      })
      .catch(() => {
        if (active)
          setError("Could not load restaurants from the server. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="my-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Restaurants</h1>
        <p className="text-base-content/60 mt-2">
          Explore partner restaurants delivering in your area.
        </p>
      </div>

      {loading ? (
        <CardGridSkeleton count={9} imageHeight="h-40" />
      ) : error ? (
        <p className="text-center text-base-content/50 py-16">{error}</p>
      ) : restaurants.length === 0 ? (
        <p className="text-center text-base-content/50 py-16">
          No restaurants available right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((r) => (
            <div key={r.id} className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
              <figure className="h-44 overflow-hidden relative">
                {r.image ? (
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-base-200 flex items-center justify-center">
                    <span className="text-5xl">🍽️</span>
                  </div>
                )}
                <span className="absolute top-3 right-3 badge badge-primary">★ {r.rating || "—"}</span>
              </figure>
              <div className="card-body p-4">
                <h2 className="card-title">{r.name}</h2>
                <p className="text-base-content/60 text-sm flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {r.cuisine}
                  {r.address ? ` • ${r.address}` : ""}
                </p>
                <p className="text-base-content/60 text-sm flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {r.time} delivery
                </p>
                {r.is_open !== undefined && (
                  <span className={`badge ${r.is_open ? "badge-success" : "badge-warning"} w-fit`}>
                    {r.is_open ? "Open" : "Closed"}
                  </span>
                )}
                <Link to={`/restaurants/${r.id}`} className="btn btn-primary btn-sm mt-2 w-fit">
                  View Menu
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Restaurants;
