import { Link } from "react-router-dom";
import FoodCard from "../../components/Card/Card";
import { useFavoritesStore } from "../../store/favoritesStore";

const Favorites = () => {
  const favorites = useFavoritesStore((s) => s.favorites);

  return (
    <div className="my-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Favorites</h1>
        <p className="text-base-content/60 mt-2">
          Your saved dishes, ready to order anytime.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="max-w-md mx-auto card bg-base-100 shadow-md p-10 text-center">
          <p className="text-5xl">❤️</p>
          <h2 className="text-2xl font-bold mt-4">No favorites yet</h2>
          <p className="text-base-content/60 mt-2">
            Tap the heart on any dish to save it here.
          </p>
          <Link to="/menu" className="btn btn-primary mt-6">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="food-grid">
          {favorites.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
