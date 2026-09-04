// Shared hook for loading the authenticated customer's real order analytics
// via the existing /api/user/orders-summary endpoint. Every dashboard page
// reuses this so loading/error/refresh behaviour stays consistent.

import { useCallback, useEffect, useState } from "react";
import { fetchOrderSummary } from "../services/orderService";

export function useOrderSummary(range = "year") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchOrderSummary(range);
      setData(result);
    } catch {
      setError("Failed to load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    orders: data?.orders || [],
    totalSpent: Number(data?.total_spent || 0),
    totalOrders: Number(data?.total_orders || 0),
    from: data?.from,
    to: data?.to,
    loading,
    error,
    reload: load,
  };
}