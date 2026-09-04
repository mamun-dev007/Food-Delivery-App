import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MapPin, Clock, Search } from "lucide-react";
import FoodCard from "../../components/Card/Card";
import { fetchFoods } from "../../services/foodService";
import { fetchRestaurants } from "../../services/restaurantPublicService";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [allFoods, setAllFoods] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchFoods().catch(() => []),
      fetchRestaurants().catch(() => []),
    ]).then(([foodList, restaurantList]) => {
      if (!active) return;
      setAllFoods(foodList);
      setAllRestaurants(restaurantList);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleQueryChange = (value) => {
    setQuery(value);
    if (value.trim()) {
      setSearchParams({ q: value.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const q = query.trim().toLowerCase();

  const foodResults = q
    ? allFoods.filter((f) => (f.name || "").toLowerCase().includes(q))
    : [];
  const restaurantResults = q
    ? allRestaurants.filter((r) =>
        (r.name || r.restaurant_name || "").toLowerCase().includes(q)
      )
    : [];

  return (
    <div className="my-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Search</h1>
        <p className="text-base-content/60 mt-2">
          Find your favorite dishes or restaurants.
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input
            autoFocus
            type="text"
            placeholder="Search food or restaurant..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="input input-bordered w-full py-3 pl-12 pr-4 text-base rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-base-content/50">Searching...</div>
      ) : q ? (
        <div className="space-y-12">
          <div>
            <h2 className="text-xl font-bold mb-4">Restaurants</h2>
            {restaurantResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurantResults.map((r) => (
                  <div
                    key={r.id}
                    className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow"
                  >
                    <figure className="h-44 overflow-hidden relative">
                      {r.image ? (
                        <img
                          src={r.image}
                          alt={r.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
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
                        <span
                          className={`badge ${r.is_open ? "badge-success" : "badge-warning"} w-fit`}
                        >
                          {r.is_open ? "Open" : "Closed"}
                        </span>
                      )}
                      <Link
                        to={`/restaurants/${r.id}`}
                        className="btn btn-primary btn-sm mt-2 w-fit"
                      >
                        View Menu
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base-content/50">No restaurants found.</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Foods</h2>
            {foodResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {foodResults.map((f) => (
                  <FoodCard key={f.id} food={f} />
                ))}
              </div>
            ) : (
              <p className="text-base-content/50">No foods found.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-base-content/50">
          Type something to search foods and restaurants.
        </div>
      )}
    </div>
  );
};

export default SearchPage;