import { Link } from "react-router-dom";
import { User, Store, Bike } from "lucide-react";
import logo from "../../assets/logo.png";

const roles = [
  {
    role: "customer",
    title: "Customer",
    icon: User,
    color: "bg-blue-100 text-blue-600",
    desc: "Order food, track deliveries, and save your favorites.",
    to: "/customer/login",
  },
  {
    role: "restaurantOwner",
    title: "Restaurant Owner",
    icon: Store,
    color: "bg-emerald-100 text-emerald-700",
    desc: "Manage foods, orders, sales, and your restaurant profile.",
    to: "/restaurant-owner/login",
  },
  {
    role: "rider",
    title: "Delivery Rider",
    icon: Bike,
    color: "bg-orange-100 text-orange-600",
    desc: "Accept deliveries, update status, and track your earnings.",
    to: "/rider/login",
  },
];

const Auth = () => {
  return (
    <div className="my-16 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <img src={logo} alt="Foodie" className="h-12 w-auto object-contain" />
          <span>
            Welcome to <span className="text-primary font-extrabold">Foo</span>
            <span className="text-secondary font-extrabold">die</span>
          </span>
        </h1>
        <p className="text-base-content/60 mt-2">
          Choose who you are to continue.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {roles.map((r) => (
          <Link
            key={r.role}
            to={r.to}
            className="card bg-base-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all p-8 text-center"
          >
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${r.color}`}
            >
              <r.icon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mt-4">{r.title}</h2>
            <p className="text-base-content/60 mt-2 text-sm">{r.desc}</p>
            <span className="btn btn-outline btn-primary mt-6">
              Login
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Auth;
