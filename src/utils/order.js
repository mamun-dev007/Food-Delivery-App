// Shared order helpers used across the customer dashboard.

export const orderIsActive = (status) =>
  status === "Pending" || status === "Preparing" || status === "On The Way";