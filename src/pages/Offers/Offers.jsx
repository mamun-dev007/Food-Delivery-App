import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCoupons } from "../../services/couponService";
import { CardGridSkeleton } from "../../components/dashboard/Skeleton";

const badgeColor = (i) => {
  const colors = ["from-primary to-secondary", "from-success to-info", "from-warning to-error", "from-info to-primary"];
  return colors[i % colors.length];
};

const badgeLabel = (coupon) => {
  if (coupon.type === "Percentage") return `${coupon.value}%`;
  if (coupon.type === "Flat Amount") return `$${coupon.value}`;
  return "Free Delivery";
};

const Offers = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCoupons()
      .then((list) => active && setCoupons(list))
      .catch(() => active && setCoupons([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const heroCode = coupons[0]?.code || "WELCOME30";
  const heroValue = coupons[0] ? badgeLabel(coupons[0]) : "30% OFF";

  return (
    <div className="my-8">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden rounded-3xl mb-10"
        style={{
          background: "linear-gradient(135deg, #ff6b35 0%, #f72585 50%, #7209b7 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 p-10 md:p-14">
          <div className="text-white text-center md:text-left">
            <span className="inline-block bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Limited Time Offer
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Get {heroValue} OFF on Your Order!
            </h1>
            <p className="text-white/80 text-lg max-w-lg">
              Sign up, order your favorite meal, and apply the promo code at
              checkout. It's that simple!
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className="bg-white rounded-2xl px-8 py-5 text-center shadow-xl">
              <p className="text-sm text-gray-500 mb-1">Your Promo Code</p>
              <p className="text-3xl font-bold text-primary tracking-widest">
                {heroCode}
              </p>
            </div>
            <Link
              to="/menu"
              className="btn btn-lg bg-white text-primary border-none hover:bg-white/90 font-bold"
            >
              Order Now
            </Link>
          </div>
        </div>
      </div>

      {/* All Offers Grid */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">All Offers & Deals</h2>
        <p className="text-base-content/60 mt-2">
          These are real, active coupon codes. Apply them at checkout to save.
        </p>
      </div>

      {loading ? (
        <CardGridSkeleton count={6} imageHeight="h-32" />
      ) : coupons.length === 0 ? (
        <div className="card bg-base-100 shadow-md p-10 text-center">
          <p className="text-5xl">🎁</p>
          <h2 className="text-xl font-bold mt-4">No active offers right now</h2>
          <p className="text-base-content/60 mt-2">
            Check back soon for new deals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((c, i) => (
            <div
              key={c.id}
              className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="card-body">
                <div className="flex justify-between items-center gap-2">
                  <h2 className="card-title">
                    {badgeLabel(c)}
                    {c.type === "Percentage" ? " Off Your Order" : c.type === "Flat Amount" ? " Off Your Order" : " On Your Order"}
                  </h2>
                  <span className={`badge badge-lg bg-gradient-to-r ${badgeColor(i)} text-white border-none`}>
                    {c.type === "Percentage" ? "Discount" : c.type === "Flat Amount" ? "Discount" : "Popular"}
                  </span>
                </div>
                <p className="text-base-content/60">
                  {c.description ||
                    `Save ${badgeLabel(c)} on your order with code ${c.code}. Applies automatically at checkout.`}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <code className="px-4 py-2 bg-base-200 rounded-lg font-bold text-lg tracking-wider">
                    {c.code}
                  </code>
                  <Link to="/cart" className="btn btn-sm btn-primary">
                    Use Code
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Offers;
