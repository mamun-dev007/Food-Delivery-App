import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import RestaurantSettings from "../Restaurant/Settings/Settings";

// The full real settings form (saved to MongoDB) rendered inside
// the new dashboard layout.
const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <RestaurantSettings />
      <div className="mt-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="btn btn-outline btn-primary gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;