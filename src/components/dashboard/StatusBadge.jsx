const STATUS_STYLES = {
  Pending: "badge-warning",
  Preparing: "badge-info",
  "Ready for Pickup": "badge-primary",
  "In Progress": "badge-info",
  "On The Way": "badge-primary",
  Delivered: "badge-success",
  Cancelled: "badge-error",
  Refunded: "badge-ghost",
};

const StatusBadge = ({ status }) => {
  const key = status || "Pending";
  return (
    <span className={`badge badge-sm ${STATUS_STYLES[key] || "badge-ghost"}`}>
      {key}
    </span>
  );
};

export default StatusBadge;