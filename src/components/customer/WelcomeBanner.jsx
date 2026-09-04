import { Link } from "react-router-dom";
import { Clock, UtensilsCrossed } from "lucide-react";

const IMG = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
  cola: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=600&q=80",
};

// Decorative floating food plate (burger + fries + drink) on the banner right.
const FoodPlate = () => (
  <div className="pointer-events-none relative hidden h-56 w-56 shrink-0 md:block lg:h-64 lg:w-64">
    {/* fries */}
    <img
      src={IMG.fries}
      alt="French fries"
      className="absolute right-1 top-3 h-24 w-24 rotate-6 rounded-3xl object-cover shadow-xl ring-4 ring-white/30 lg:h-28 lg:w-28"
    />
    {/* drink */}
    <img
      src={IMG.cola}
      alt="Soft drink"
      className="absolute bottom-6 right-0 h-28 w-20 rounded-3xl object-cover shadow-xl ring-4 ring-white/30 lg:h-32 lg:w-24"
    />
    {/* burger */}
    <img
      src={IMG.burger}
      alt="Chicken burger"
      className="absolute left-0 top-8 h-40 w-48 rounded-3xl object-cover shadow-xl ring-4 ring-white/30 lg:h-44 lg:w-52"
    />
  </div>
);

const WelcomeBanner = ({ name, activeCount }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-lg shadow-violet-600/20">
    {/* soft glows */}
    <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-fuchsia-400/30 blur-3xl" />

    <div className="relative flex items-center justify-between gap-6 px-6 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div className="max-w-lg">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
          Welcome back
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white lg:text-3xl">
          Good Morning, {name}!
        </h1>
        <p className="mt-1.5 text-sm text-white/80">
          {activeCount > 0
            ? `You have ${activeCount} active order${activeCount > 1 ? "s" : ""} on the way.`
            : "Ready to order something delicious today?"}
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-violet-700 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <UtensilsCrossed className="h-4 w-4" /> Browse Menu
          </Link>
          <Link
            to="/customer/dashboard/active-orders"
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <Clock className="h-4 w-4" /> Track Orders
          </Link>
        </div>
      </div>

      <FoodPlate />
    </div>
  </div>
);

export default WelcomeBanner;