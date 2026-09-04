import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Truck, UtensilsCrossed, ShieldCheck, MapPin, Search, ShoppingCart, PackageCheck, Star, Quote } from "lucide-react";
import logo from "../../assets/logo.png";
import Hero from "../../components/Hero/Hero";
import FoodCard from "../../components/Card/Card";
import { fetchPopularFoods } from "../../services/foodService";
import { fetchReviews } from "../../services/reviewService";
import { CardGridSkeleton } from "../../components/dashboard/Skeleton";

const whyChooseUs = [
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Lightning-fast delivery to your doorstep. Your food arrives hot and fresh, every single time.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: UtensilsCrossed,
    title: "Fresh & Quality Food",
    desc: "Partnered with top restaurants committed to using fresh, high-quality ingredients in every dish.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    desc: "Pay with confidence using our secure, encrypted payment system. Multiple options available.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: MapPin,
    title: "Live Order Tracking",
    desc: "Track your order in real-time from restaurant to your door. Know exactly when it arrives.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
];

const shortcuts = [
  { to: "/categories", emoji: "🍔", label: "Food Categories" },
  { to: "/offers", emoji: "🏷️", label: "Offers & Discounts" },
  { to: "/restaurants", emoji: "🍽️", label: "Restaurants" },
  { to: "/track-order", emoji: "📦", label: "Track Order" },
  { to: "/reviews", emoji: "⭐", label: "Reviews" },
  { to: "/favorites", emoji: "❤️", label: "Favorites" },
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const getRelativeTime = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
};

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    fetchPopularFoods(8)
      .then(setFeatured)
      .finally(() => setLoading(false));

    fetchReviews()
      .then((data) => setReviews(data.slice(0, 6)))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, []);

  return (
    <div>
      <Hero />

      <section className="my-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {shortcuts.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="card bg-base-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-4 items-center text-center"
          >
            <span className="text-3xl">{s.emoji}</span>
            <span className="text-sm font-medium mt-2">{s.label}</span>
          </Link>
        ))}
      </section>

      <section className="my-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Popular Dishes</h2>
            <p className="text-base-content/60 mt-1">
              Most loved meals ordered by our customers.
            </p>
          </div>
          <Link to="/menu" className="btn btn-outline btn-primary btn-sm">
            View all menu
          </Link>
        </div>
        {loading ? (
          <CardGridSkeleton count={4} />
        ) : (
          <div className="food-grid">
            {featured.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        )}
      </section>
      <section className="my-12">
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #ff6b35 0%, #f72585 50%, #7209b7 100%)",
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-12">
            <div className="text-white text-center md:text-left">
              <span className="inline-block bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full mb-4">
                Special Offer
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Get 30% OFF on Your First Order!
              </h2>
              <p className="text-white/80 text-lg max-w-md">
                New to Foodie? Use our promo code at checkout and enjoy a delicious discount on us.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white rounded-2xl px-6 py-4 text-center shadow-lg">
                <p className="text-sm text-gray-500 mb-1">Promo Code</p>
                <p className="text-2xl font-bold text-primary tracking-widest">WELCOME30</p>
              </div>
              <Link to="/menu" className="btn btn-lg bg-white text-primary border-none hover:bg-white/90 font-bold">
                Order Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="my-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Why Choose Us</h2>
          <p className="text-base-content/60 mt-2 max-w-lg mx-auto">
            We're not just another food delivery app. Here's what makes Foodie different.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChooseUs.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="card bg-base-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-center"
              >
                <div className="card-body items-center">
                  <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <h3 className="card-title text-lg">{item.title}</h3>
                  <p className="text-base-content/60 text-sm">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="my-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-base-content/60 mt-2 max-w-lg mx-auto">
            Getting your favorite food is just 3 simple steps away.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: 1,
              icon: Search,
              title: "Choose Food",
              desc: "Browse our wide selection of restaurants and dishes. Pick what you're craving.",
              color: "text-primary",
              bg: "bg-primary",
            },
            {
              step: 2,
              icon: ShoppingCart,
              title: "Place Order",
              desc: "Add items to your cart, apply a promo code, and check out securely in seconds.",
              color: "text-secondary",
              bg: "bg-secondary",
            },
            {
              step: 3,
              icon: PackageCheck,
              title: "Get It Delivered",
              desc: "Sit back and relax. Track your order live and enjoy hot, fresh food at your door.",
              color: "text-success",
              bg: "bg-success",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative text-center">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[calc(100%-20%)] h-[2px] bg-base-300" />
                )}
                <div className={`w-20 h-20 rounded-full ${item.bg} text-white flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg`}>
                  <Icon className="w-9 h-9" />
                </div>
                <span className={`inline-block text-sm font-bold ${item.color} mb-1`}>
                  Step {item.step}
                </span>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-base-content/60 text-sm max-w-xs mx-auto">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="my-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">What Our Customers Say</h2>
          <p className="text-base-content/60 mt-2 max-w-lg mx-auto">
            Don't just take our word for it. Here's what real customers think.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewsLoading ? (
            <CardGridSkeleton count={3} />
          ) : reviews.length === 0 ? (
            <p className="text-base-content/60 col-span-full text-center">
              No reviews yet. Be the first to share your experience!
            </p>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id || r.name}
                className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="card-body">
                  <Quote className="w-8 h-8 text-primary/20 mb-1" />
                  <p className="text-base-content/80 italic mb-4">"{r.text}"</p>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {r.avatar_url ? (
                      <img
                        src={r.avatar_url}
                        alt={r.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full ring-2 ring-primary/20 bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(r.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-base-content/50">
                        {getRelativeTime(r.created_at)}
                        {r.dish ? ` • Ordered ${r.dish}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* App Promotion */}
      <section className="my-12">
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        >
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative flex flex-col-reverse lg:flex-row items-center gap-10 p-10 md:p-14">
            {/* Text + Buttons */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block bg-white/10 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4">
                Coming Soon
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Order Faster with Our Mobile App
              </h2>
              <p className="text-white/70 text-lg max-w-md mb-8">
                Get exclusive app-only deals, lightning-fast ordering, and real-time tracking — all in the palm of your hand.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a
                  href="#"
                  className="btn btn-lg bg-white text-gray-900 border-none hover:bg-white/90 gap-3"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-xs leading-none opacity-70">GET IT ON</p>
                    <p className="text-base font-bold leading-tight">Google Play</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="btn btn-lg bg-white text-gray-900 border-none hover:bg-white/90 gap-3"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.81 11.78 5.72 12.57 5.72C13.36 5.72 14.85 4.62 16.4 4.8C17.06 4.83 18.82 5.08 19.97 6.72C19.87 6.78 17.67 8.05 17.69 10.73C17.72 13.93 20.55 14.98 20.58 14.99C20.55 15.06 20.11 16.6 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-xs leading-none opacity-70">Download on the</p>
                    <p className="text-base font-bold leading-tight">App Store</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-64 h-[480px] bg-gray-900 rounded-[3rem] border-4 border-gray-700 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
                  <div className="w-full h-full bg-gradient-to-b from-primary to-secondary p-4 pt-10 text-white flex flex-col items-center justify-center">
                    <img
                      src={logo}
                      alt="Foodie"
                      className="h-10 w-auto object-contain rounded mb-2 bg-white/90 p-1"
                    />
                    <p className="text-xl font-bold mb-1">
                      <span className="text-white">Foo</span>
                      <span className="text-yellow-300">die</span>
                    </p>
                    <p className="text-white/70 text-sm mb-6">Food Delivery</p>
                    <div className="w-full space-y-2">
                      <div className="bg-white/20 rounded-xl h-8 w-full" />
                      <div className="bg-white/20 rounded-xl h-8 w-3/4" />
                      <div className="bg-white/20 rounded-xl h-8 w-5/6" />
                    </div>
                    <div className="mt-auto w-full bg-white text-primary font-bold text-center py-3 rounded-xl">
                      Order Now
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="my-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary p-10 md:p-14 text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-white rounded-full -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white rounded-full translate-y-1/2" />
          </div>
          <div className="relative">
            <span className="text-5xl mb-4 block">🍔</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Hungry? Let's fix that.
            </h2>
            <p className="text-white/80 text-lg max-w-md mx-auto mb-8">
              Subscribe to get exclusive deals, new menu drops, and a 30% off welcome gift straight to your inbox.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const email = e.target.email.value;
                if (email) {
                  toast.success("Subscribed! Check your inbox for a welcome gift.");
                  e.target.reset();
                }
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="Enter your email address"
                className="input input-lg flex-1 bg-white text-gray-900 placeholder-gray-400 border-none"
              />
              <button type="submit" className="btn btn-lg bg-white text-primary border-none hover:bg-white/90 font-bold whitespace-nowrap">
                Subscribe & Order
              </button>
            </form>
            <p className="text-white/50 text-xs mt-4">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
