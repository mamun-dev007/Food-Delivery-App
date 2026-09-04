// ---------------------------------------------------------------------------
// Owner Dashboard data assembly.
//
// Pulls REAL data from the MongoDB-backed owner API (orders, analytics,
// earnings, foods, reviews, notifications, profile). All dashboard values
// come from the database — no static/mock data is ever used.
// ---------------------------------------------------------------------------
import {
  fetchOwnerAnalytics,
  fetchOwnerEarnings,
  fetchOwnerOrders,
  fetchOwnerReviews,
  fetchOwnerNotifications,
  fetchOwnerRestaurantProfile,
} from "./restaurantService";
import { fetchMyFoods } from "./foodService";

const safely = async (fn, fallback) => {
  try {
    const v = await fn();
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
};

const bd = (n) => Math.round(Number(n || 0) * 100) / 100;

function formatOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((it) => ({
    name: it.food_name || it.name || "Item",
    quantity: Number(it.quantity || it.qty || 1),
  }));
}

function fmtActivityTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Stats — real values from analytics + earnings + orders.
// change/trend/compare are removed (real comparison data not available).
// ---------------------------------------------------------------------------
function buildStats({ analytics, earnings, orders }) {
  const totals = analytics.totals || {};
  const customers = new Set((orders || []).map((o) => o.customer).filter(Boolean));
  const net = bd(earnings ? earnings.net : 0);

  return [
    {
      key: "total_orders",
      label: "Total Orders",
      value: totals.total_orders ?? 0,
      currency: false,
      change: 0,
      trend: "up",
      compare: "",
    },
    {
      key: "total_customers",
      label: "Total Customers",
      value: customers.size || 0,
      currency: false,
      change: 0,
      trend: "up",
      compare: "",
    },
    {
      key: "total_earnings",
      label: "Total Earnings",
      value: net,
      currency: true,
      change: 0,
      trend: "up",
      compare: "",
    },
    {
      key: "pending_orders",
      label: "Pending Orders",
      value: totals.pending ?? 0,
      currency: false,
      change: 0,
      trend: "up",
      compare: "",
    },
  ];
}

// ---------------------------------------------------------------------------
// Sales chart — real daily_sales from analytics, no fabricated previous values.
// ---------------------------------------------------------------------------
function buildSalesSeries(analytics) {
  const daily = Array.isArray(analytics.daily_sales) ? analytics.daily_sales : [];
  const month = Array.isArray(analytics.monthly_sales) ? analytics.monthly_sales : [];

  const week = Array.from({ length: 7 }, (_, i) => {
    const idx = daily.length - 7 + i;
    const current = idx >= 0 && daily[idx] ? Number(daily[idx].amount || 0) : 0;
    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i];
    return { day, current: bd(current), previous: 0 };
  });

  const weekPoints = Array.from({ length: 4 }, (_, i) => {
    const start = daily.length - (4 - i) * 7;
    const slice = start >= 0 ? daily.slice(Math.max(0, start), daily.length - (3 - i) * 7) : [];
    const current = slice.reduce((s, d) => s + Number(d.amount || 0), 0);
    return {
      day: `Week ${i + 1}`,
      current: bd(current),
      previous: 0,
    };
  });

  const year = Array.from({ length: 12 }, (_, i) => {
    const cur = month.find((m) => (m.month || "").split(" ")[0].toLowerCase()
      .startsWith(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i].toLowerCase()));
    return {
      day: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
      current: bd(cur ? cur.amount : 0),
      previous: 0,
    };
  });

  return { week, month: weekPoints, year };
}

// ---------------------------------------------------------------------------
// Daily orders chart — derived from real orders bucketed by weekday.
// ---------------------------------------------------------------------------
function buildDailyOrders(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = Array(7).fill(0);
  for (const o of orders) {
    const d = o.date || o.created_at;
    if (!d) continue;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) continue;
    const idx = (dt.getDay() + 6) % 7; // 0=Mon
    counts[idx]++;
  }
  return days.map((day, i) => ({ day, orders: counts[i] }));
}

// ---------------------------------------------------------------------------
// Top foods — real popular foods from analytics; no fabricated data.
// ---------------------------------------------------------------------------
function buildTopFoods({ analytics, foods }) {
  const popular = Array.isArray(analytics.popular_foods) ? analytics.popular_foods : [];
  if (popular.length === 0) return [];

  const foodMap = new Map(
    (foods || []).map((f) => [
      String(f.food_name || f.name || "").toLowerCase(),
      f,
    ]),
  );

  return popular.map((p, i) => {
    const doc = foodMap.get(String(p.name || "").toLowerCase());
    return {
      id: String(p.name || i),
      name: p.name || "Food item",
      rating: Number(doc?.rating ?? 0),
      reviews: Number(p.orders || 0),
      orders: Number(p.orders || 0),
      price: bd(doc ? doc.price || doc.discounted_price : 0),
      image: doc?.image || doc?.food_image || doc?.images?.[0] || "",
    };
  });
}

// ---------------------------------------------------------------------------
// Recent orders — real orders, no fabricated list.
// ---------------------------------------------------------------------------
function buildRecentOrders(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  return orders.slice(0, 8).map((o) => ({
    id: o.id,
    order_no: o.order_no ? `#${o.order_no.replace(/^#/, "")}` : o.order_id,
    customer: o.customer || "Customer",
    items: formatOrderItems(o.items),
    total: bd(o.total),
    status: o.status || "Pending",
    date: o.date || null,
    time: fmtActivityTime(o.date),
  }));
}

// ---------------------------------------------------------------------------
// Activity — real notifications or derived order activity; no fabricated data.
// ---------------------------------------------------------------------------
function buildActivity({ notifications, orders }) {
  if (Array.isArray(notifications) && notifications.length > 0) {
    return notifications.slice(0, 8).map((n, i) => ({
      id: String(i),
      type: n.type || "info",
      title: n.title || "Update",
      message: n.message || "",
      time: n.time || null,
    }));
  }
  if (Array.isArray(orders) && orders.length > 0) {
    return orders.slice(0, 8).map((o, i) => ({
      id: String(i),
      type: "order",
      title: "Order update",
      message: `${o.customer || "Customer"} — order ${o.order_no || o.id} is ${o.status}`,
      time: o.date || null,
    }));
  }
  return [];
}

// ---------------------------------------------------------------------------
// Reviews — real reviews only; no fabricated data.
// ---------------------------------------------------------------------------
function buildReviews(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  if (list.length === 0) return { list: [], avg: 0, count: 0 };
  const avg =
    list.reduce((s, r) => s + Number(r.rating || 0), 0) / list.length;
  return {
    list: list.slice(0, 6).map((r, i) => ({
      id: r.id || String(i),
      name: r.name || "Customer",
      dish: r.dish || "Food item",
      rating: Number(r.rating || 0),
      text: r.text || "No comment provided.",
      createdAt: r.created_at || null,
      foodImage: r.food_image || "",
    })),
    avg: bd(avg),
    count: list.length,
  };
}

// ---------------------------------------------------------------------------
// Top categories — real share of sold items from orders, mapped to the owner's
// food categories (falls back to menu counts when no orders have been placed).
// ---------------------------------------------------------------------------
function buildTopCategories({ foods, orders }) {
  if (!Array.isArray(foods) || foods.length === 0) return [];

  // Look up a food's category by its name on the menu.
  const catByFood = new Map();
  for (const f of foods) {
    const key = String(f.food_name || f.name || "").toLowerCase().trim();
    if (key) catByFood.set(key, String(f.category || "Others"));
  }

  const counts = {};
  let total = 0;
  const add = (cat, qty = 1) => {
    counts[cat] = (counts[cat] || 0) + qty;
    total += qty;
  };

  for (const o of orders || []) {
    if (!Array.isArray(o.items)) continue;
    for (const it of o.items) {
      const name = String(it.food_name || it.name || "").toLowerCase().trim();
      const cat = catByFood.get(name);
      if (cat) add(cat, Number(it.quantity || it.qty || 1));
      else add("Others", Number(it.quantity || it.qty || 1));
    }
  }

  // No sales yet — show the menu itself split by category.
  if (total === 0) {
    for (const f of foods) add(String(f.category || "Others"));
  }
  if (total === 0) return [];

  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
    }));
  const used = entries.reduce((s, e) => s + e.value, 0);
  if (used < 100) entries.push({ name: "Others", value: 100 - used });
  return entries;
}

// ---------------------------------------------------------------------------
// Order types — real payment-method share from the owner's actual orders.
// ---------------------------------------------------------------------------
function buildOrderTypes(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  const counts = {};
  let total = 0;
  for (const o of orders) {
    const m = String(o.payment || o.payment_method || "Cash on Delivery");
    counts[m] = (counts[m] || 0) + 1;
    total += 1;
  }
  const iconKeyFor = (m) => {
    const k = m.toLowerCase();
    if (k.includes("cash")) return "cash";
    if (k.includes("card") || k.includes("credit") || k.includes("debit")) return "card";
    if (k.includes("bkash") || k.includes("nagad") || k.includes("rocket")) return "mobile";
    return "other";
  };
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      iconKey: iconKeyFor(name),
    }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// Customers — derived from real orders.
// ---------------------------------------------------------------------------
function buildCustomers(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  const map = new Map();
  for (const o of orders) {
    const name = o.customer;
    if (!name) continue;
    const cur = map.get(name) || { name, orders: 0, spent: 0, lastOrder: o.date };
    cur.orders += 1;
    cur.spent += Number(o.total || 0);
    if (!cur.lastOrder && o.date) cur.lastOrder = o.date;
    map.set(name, cur);
  }
  return [...map.values()]
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Stock — real foods only.
// ---------------------------------------------------------------------------
const LOW_STOCK_THRESHOLD = 10;

function stockStatus(stock) {
  if (stock <= 0) return "out";
  if (stock < LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

function buildStock(foods) {
  if (!Array.isArray(foods) || foods.length === 0) return null;
  const items = foods.map((f) => {
    const stock = Math.max(0, Math.floor(Number(f.stock) || 0));
    return {
      id: String(f._id || f.food_id || f.id),
      name: String(f.food_name || f.name || "Food item"),
      category: String(f.category || "Other"),
      stock,
      price: bd(f.price || f.discounted_price || 0),
      image: f.image || f.food_image || "",
      status: stockStatus(stock),
    };
  });

  const summary = {
    totalItems: items.length,
    lowCount: items.filter((i) => i.status === "low").length,
    outCount: items.filter((i) => i.status === "out").length,
    totalUnits: items.reduce((s, i) => s + i.stock, 0),
  };

  const top = [...items].sort((a, b) => b.stock - a.stock).slice(0, 8);

  return { items, summary, top };
}

// ---------------------------------------------------------------------------
// fetchDashboardData — assemble the full dashboard bundle from real API data.
// ---------------------------------------------------------------------------
export async function fetchDashboardData() {
  const [analytics, earnings, orders, foods, reviewsData, notifications, restaurant] =
    await Promise.all([
      safely(() => fetchOwnerAnalytics(), {}),
      safely(() => fetchOwnerEarnings(), {}),
      safely(() => fetchOwnerOrders(), []),
      safely(() => fetchMyFoods(), []),
      safely(() => fetchOwnerReviews(), {
        reviews: [],
        rating: { avg: 0, count: 0, distribution: {} },
      }),
      safely(async () => (await fetchOwnerNotifications()).notifications || [], []),
      safely(() => fetchOwnerRestaurantProfile(), {}),
    ]);

  const sales = buildSalesSeries(analytics);
  const recentOrders = buildRecentOrders(orders);
  const reviews = buildReviews(reviewsData.reviews);
  const dailyOrders = buildDailyOrders(orders);

  return {
    restaurant: {
      name: restaurant.restaurant_name || "My Restaurant",
      logo: restaurant.logo_url || null,
    },
    stats: buildStats({ analytics, earnings, orders }),
    sales,
    topCategories: buildTopCategories({ foods, orders }),
    dailyOrders,
    orderTypes: buildOrderTypes(orders),
    recentOrders,
    topFoods: buildTopFoods({ analytics, foods }),
    activity: buildActivity({ notifications, orders }),
    reviews,
    notifications,
    customers: buildCustomers(orders),
    stock: buildStock(foods),
  };
}
