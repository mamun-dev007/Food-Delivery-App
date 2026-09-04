import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import FoodCard from "../../components/Card/Card";
import { fetchFoods } from "../../services/foodService";
import { fetchRestaurant } from "../../services/restaurantPublicService";
import { SkeletonCard, CardGridSkeleton } from "../../components/dashboard/Skeleton";

function toCardShape(db) {
  return {
    id: db.id || db.food_id,
    name: db.name || db.food_name,
    category: db.category,
    price: Number(db.price || 0),
    discount: Number(db.discount || 0),
    rating: Number(db.rating != null ? db.rating : 4.5),
    image: db.image || "",
    restaurant: {
      id: db.restaurant_id,
      name: db.restaurant_name || "Restaurant",
      logo: db.restaurant_logo || "",
    },
  };
}

const RestaurantMenu = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([fetchRestaurant(id), fetchFoods(id)])
      .then(([rest, foodList]) => {
        if (!active) return;
        setRestaurant(rest);
        setFoods(foodList.map(toCardShape));
      })
      .catch(() => {
        if (active) {
          setRestaurant(null);
          setFoods([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center my-16">
        <h1 className="text-2xl font-bold">Restaurant not found</h1>
        <Link to="/restaurants" className="btn btn-ghost btn-sm mt-4">
          ← All Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="my-8">
      {/* Restaurant photo banner */}
      <div className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden bg-base-200 mb-6">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {restaurant.name}
          </h1>
          <p className="text-white/80 mt-1">
            {restaurant.cuisine}
            {restaurant.address ? ` • ${restaurant.address}` : ""}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <Link to="/restaurants" className="btn btn-ghost btn-sm">
          ← All Restaurants
        </Link>
      </div>

      {foods.length === 0 ? (
        <div className="text-center text-base-content/50 py-16 bg-base-100 rounded-2xl shadow-sm">
          <span className="text-5xl">🍴</span>
          <h3 className="text-xl font-semibold mt-3">No menu yet</h3>
          <p className="mt-1">
            This restaurant hasn't added any food items yet.
          </p>
        </div>
      ) : (
        <div className="food-grid">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantMenu;
