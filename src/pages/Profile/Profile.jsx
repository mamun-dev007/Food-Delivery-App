import { useState } from "react";
import OrderAnalytics from "../../components/OrderAnalytics/OrderAnalytics";

const Profile = () => {
  const [name, setName] = useState("Mamun");
  const [email, setEmail] = useState("foodie@example.com");
  const [phone, setPhone] = useState("+8801XXXXXXXXX");

  return (
    <div className="my-8 max-w-5xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">My Profile</h1>
        <p className="text-base-content/60 mt-2">
          Manage your personal information and order analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal info */}
        <div className="card bg-base-100 shadow-md p-6 h-fit">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
              <span className="text-4xl font-bold text-primary-content">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-3">{name}</h2>
          </div>
          <div className="form-control gap-2">
            <label className="label">
              <span className="label-text">Full Name</span>
            </label>
            <input
              className="input input-bordered"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              className="input input-bordered"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="label">
              <span className="label-text">Phone</span>
            </label>
            <input
              className="input input-bordered"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="btn btn-primary mt-4 w-fit px-8">
              Save Changes
            </button>
          </div>
        </div>

        {/* Order Analytics & History */}
        <div className="lg:col-span-2">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Order Analytics & History</h2>
            <p className="text-base-content/60">
              Filter by time range to see your spending and past orders.
            </p>
          </div>
          <OrderAnalytics />
        </div>
      </div>
    </div>
  );
};

export default Profile;
