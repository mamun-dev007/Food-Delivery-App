import React from 'react';
import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import Root from '../Root/Root';
import Home from '../pages/Home/Home';
import Menu from '../pages/Menu/Menu';
import FoodDetails from '../pages/FoodDetails/FoodDetails';
import Restaurants from '../pages/Restaurants/Restaurants';
import RestaurantMenu from '../pages/RestaurantMenu/RestaurantMenu';
import Categories from '../pages/Categories/Categories';
import SearchPage from '../pages/Search/Search';
import Offers from '../pages/Offers/Offers';
import Favorites from '../pages/Favorites/Favorites';
import Cart from '../pages/Cart/Cart';
import Checkout from '../pages/Checkout/Checkout';
import TrackOrder from '../pages/TrackOrder/TrackOrder';
import MyOrders from '../pages/MyOrders/MyOrders';
import Invoice from '../pages/Invoice/Invoice';
import Reviews from '../pages/Reviews/Reviews';
import Profile from '../pages/Profile/Profile';
import Login from '../pages/Auth/Login';
import Auth from '../pages/Auth/Auth';
import CustomerLogin from '../pages/Auth/CustomerLogin';
import CustomerSignup from '../pages/Auth/CustomerSignup';
import RestaurantOwnerLogin from '../pages/Auth/RestaurantOwnerLogin';
import RestaurantOwnerSignup from '../pages/Auth/RestaurantOwnerSignup';
import RestaurantVerification from '../pages/Auth/RestaurantVerification';
import RiderLogin from '../pages/Auth/RiderLogin';
import RiderSignup from '../pages/Auth/RiderSignup';
import RiderVerification from '../pages/Auth/RiderVerification';
import Unauthorized from '../pages/Unauthorized/Unauthorized';
import AddFood from '../pages/Restaurant/Foods/AddFood';
import Manage from '../pages/Restaurant/Manage/Manage';
import CustomerDashboardLayout from '../pages/CustomerDashboard/CustomerDashboardLayout';
import CustomerOverview from '../pages/CustomerDashboard/Overview/Overview';
import ActiveOrders from '../pages/CustomerDashboard/ActiveOrders/ActiveOrders';
import OrderHistory from '../pages/CustomerDashboard/OrderHistory/OrderHistory';
import FavoriteRestaurants from '../pages/CustomerDashboard/FavoriteRestaurants/FavoriteRestaurants';
import CustomerProfile from '../pages/CustomerDashboard/Profile/Profile';
import Addresses from '../pages/CustomerDashboard/Addresses/Addresses';
import PaymentMethods from '../pages/CustomerDashboard/PaymentMethods/PaymentMethods';
import Notifications from '../pages/CustomerDashboard/Notifications/Notifications';
import Settings from '../pages/CustomerDashboard/Settings/Settings';
import OrderDetails from '../pages/CustomerDashboard/OrderDetails/OrderDetails';
import RiderLayout from '../pages/Rider/RiderLayout';
import RiderOverview from '../pages/Rider/Overview/Overview';
import AvailableOrders from '../pages/Rider/Available/Available';
import ActiveDelivery from '../pages/Rider/ActiveDelivery/ActiveDelivery';
import MyDeliveries from '../pages/Rider/Deliveries/Deliveries';
import DeliveryHistory from '../pages/Rider/History/History';
import Earnings from '../pages/Rider/Earnings/Earnings';
import RiderPerformance from '../pages/Rider/Performance/Performance';
import RiderReviews from '../pages/Rider/Reviews/Reviews';
import RiderNotifications from '../pages/Rider/Notifications/Notifications';
import RiderSettings from '../pages/Rider/Settings/Settings';
import RiderProfile from '../pages/Rider/Profile/Profile';
import OwnerDashboardLayout from '../pages/OwnerDashboard/OwnerDashboardLayout';
import OwnerDashboard from '../pages/OwnerDashboard/Dashboard';
import OwnerOrders from '../pages/OwnerDashboard/Orders';
import OwnerMenu from '../pages/OwnerDashboard/Menu';
import OwnerCategories from '../pages/OwnerDashboard/Categories';
import OwnerCustomers from '../pages/OwnerDashboard/Customers';
import OwnerReviews from '../pages/OwnerDashboard/Reviews';
import OwnerSales from '../pages/OwnerDashboard/Sales';
import OwnerStock from '../pages/OwnerDashboard/Stock';
import OwnerCoupons from '../pages/OwnerDashboard/Coupons';
import OwnerReports from '../pages/OwnerDashboard/Reports';
import OwnerSettings from '../pages/OwnerDashboard/Settings';
import AdminLayout from '../pages/Admin/AdminLayout';
import AdminDashboard from '../pages/Admin/Dashboard/Dashboard';
import AdminRestaurants from '../pages/Admin/Restaurants/Restaurants';
import Riders from '../pages/Admin/Riders/Riders';
import AdminOrders from '../pages/Admin/Orders/Orders';
import AdminProfile from '../pages/Admin/Profile/Profile';
import AdminCategories from '../pages/Admin/Categories/Categories';
import Coupons from '../pages/Admin/Coupons/Coupons';
import RevenueDashboard from '../pages/Admin/Revenue/Revenue';
import Customers from '../pages/Admin/Customers';
import AdminFoods from '../pages/Admin/Foods';
import AdminReviews from '../pages/Admin/Reviews';
import AdminPayments from '../pages/Admin/Payments';
import AdminReports from '../pages/Admin/Reports';
import AdminAnalytics from '../pages/Admin/Analytics';
import AdminNotifications from '../pages/Admin/Notifications';
import AdminSettings from '../pages/Admin/Settings';
import RestaurantRequests from '../pages/Admin/RestaurantRequests/RestaurantRequests';
import RiderRequests from '../pages/Admin/RiderRequests/RiderRequests';
import ErrorPage from '../pages/Error/ErrorPage';
import { RequireAuth } from '../components/RequireAuth/RequireAuth';
import { RequireApprovedRestaurant } from '../components/RequireApprovedRestaurant/RequireApprovedRestaurant';
import { RequireApprovedRider } from '../components/RequireApprovedRider/RequireApprovedRider';
import { RequireCustomer } from '../components/RequireCustomer/RequireCustomer';
import { ROLES } from '../utils/roles';

// Role-protected restaurant-owner panel (sidebar layout).
const RiderPanel = () => (
  <RequireApprovedRider>
    <RequireAuth allowedRoles={[ROLES.rider]}>
      <RiderLayout />
    </RequireAuth>
  </RequireApprovedRider>
);

const AdminPanel = () => (
  <RequireAuth allowedRoles={[ROLES.admin]}>
    <AdminLayout />
  </RequireAuth>
);

const CustomerPanel = () => (
  <RequireAuth allowedRoles={[ROLES.customer]}>
    <CustomerDashboardLayout />
  </RequireAuth>
);

// /customer/track-order/:id  ->  reuses the working track page via URL param.
const TrackOrderByParam = () => {
  const { id } = useParams();
  return <Navigate to={`/track-order?order=${encodeURIComponent(id)}`} replace />;
};

export const router = createBrowserRouter([
  // ------------------------------------------------------------------
  // Public site + customer app (Root = Navbar + Footer)
  // ------------------------------------------------------------------
  {
    path: "/",
    Component: Root,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', index: true, Component: Home },
      { path: '/menu', Component: Menu },
      { path: '/food/:id', Component: FoodDetails },
      { path: '/restaurants', Component: Restaurants },
      { path: '/restaurants/:id', Component: RestaurantMenu },
      { path: '/categories', Component: Categories },
      { path: '/search', Component: SearchPage },
      { path: '/offers', Component: Offers },
      { path: '/favorites', Component: Favorites },
      {
        path: '/cart',
        element: (
          <RequireCustomer>
            <Cart />
          </RequireCustomer>
        ),
      },
      {
        path: '/checkout',
        element: (
          <RequireCustomer>
            <Checkout />
          </RequireCustomer>
        ),
      },
      { path: '/track-order', Component: TrackOrder },
      {
        path: '/my-orders',
        element: (
          <RequireCustomer>
            <MyOrders />
          </RequireCustomer>
        ),
      },
      {
        path: '/invoice/:orderId',
        element: (
          <RequireCustomer>
            <Invoice />
          </RequireCustomer>
        ),
      },
      { path: '/reviews', Component: Reviews },
      { path: '/profile', Component: Profile },

      // Customer-facing auth (unified generic forms).
      { path: '/auth', Component: Auth },
      { path: '/login', Component: CustomerLogin },
      { path: '/signup', Component: CustomerSignup },
      { path: '/customer/login', element: <CustomerLogin /> },
      { path: '/unauthorized', Component: Unauthorized },

      // Restaurant-owner auth (detailed signup + login + verification notice).
      { path: '/restaurant-owner/signup', Component: RestaurantOwnerSignup },
      { path: '/restaurant-owner/login', Component: RestaurantOwnerLogin },
      { path: '/restaurant-owner/verification', Component: RestaurantVerification },

      // Rider auth (signup + login + verification notice).
      { path: '/rider/signup', Component: RiderSignup },
      { path: '/rider/login', Component: RiderLogin },
      { path: '/rider/verification', Component: RiderVerification },

      // Separate staff role-based login portals (role is locked per route).
      { path: '/admin/login', element: <Login role="admin" /> },

      // Legacy login route (kept for backward compatibility)
      { path: '/auth/customer', element: <Login role="customer" /> },
      { path: '/auth/restaurant', element: <Login role="restaurantOwner" /> },
      { path: '/auth/rider', element: <Login role="rider" /> },
      { path: '/auth/admin', element: <Login role="admin" /> },
    ]
  },

  // ------------------------------------------------------------------
  // Customer panel (standalone full-screen app — same as Rider/Admin,
  // so the public Navbar/Footer from Root are NOT rendered).
  // ------------------------------------------------------------------
  {
    path: "/customer",
    Component: CustomerPanel,
    children: [
      { index: true, element: <Navigate to="/customer/dashboard" replace /> },
      // Dashboard home + sub-pages.
      { path: "dashboard", Component: CustomerOverview },
      { path: "dashboard/my-orders", Component: MyOrders },
      { path: "dashboard/active-orders", Component: ActiveOrders },
      { path: "dashboard/order-history", Component: OrderHistory },
      { path: "dashboard/favorite-restaurants", Component: FavoriteRestaurants },
      { path: "dashboard/profile", Component: CustomerProfile },
      { path: "dashboard/addresses", Component: Addresses },
      { path: "dashboard/payment-methods", Component: PaymentMethods },
      { path: "dashboard/notifications", Component: Notifications },
      { path: "dashboard/settings", Component: Settings },
      // Short routes.
      { path: "orders", Component: MyOrders },
      { path: "orders/:id", Component: OrderDetails },
      { path: "track-order/:id", Component: TrackOrderByParam },
      // Cart & favorites open INSIDE the dashboard panel (no public navbar).
      { path: "favorites", Component: Favorites },
      { path: "cart", Component: Cart },
      {
        path: "checkout",
        element: (
          <RequireCustomer>
            <Navigate to="/checkout" replace />
          </RequireCustomer>
        ),
      },
      { path: "restaurants", element: <Navigate to="/restaurants" replace /> },
      { path: "profile", Component: CustomerProfile },
      { path: "addresses", Component: Addresses },
      { path: "payments", Component: PaymentMethods },
      { path: "notifications", Component: Notifications },
      { path: "settings", Component: Settings },
    ],
  },

  // ------------------------------------------------------------------
  // Rider panel
  // ------------------------------------------------------------------
  {
    path: "/rider",
    Component: RiderPanel,
    children: [
      { index: true, Component: RiderOverview },
      { path: "dashboard", Component: RiderOverview },
      { path: "orders", Component: AvailableOrders },
      { path: "available", Component: AvailableOrders },
      { path: "active-delivery", Component: ActiveDelivery },
      { path: "deliveries", Component: MyDeliveries },
      { path: "history", Component: DeliveryHistory },
      { path: "earnings", Component: Earnings },
      { path: "performance", Component: RiderPerformance },
      { path: "reviews", Component: RiderReviews },
      { path: "notifications", Component: RiderNotifications },
      { path: "settings", Component: RiderSettings },
      { path: "profile", Component: RiderProfile },
    ]
  },

  // ------------------------------------------------------------------
  // Owner Dashboard (new modern panel at /dashboard/*)
  // ------------------------------------------------------------------
  {
    path: "/dashboard",
    element: (
      <RequireApprovedRestaurant>
        <RequireAuth allowedRoles={[ROLES.restaurantOwner]}>
          <OwnerDashboardLayout />
        </RequireAuth>
      </RequireApprovedRestaurant>
    ),
    children: [
      { index: true, Component: OwnerDashboard },
      { path: "menu", Component: OwnerMenu },
      { path: "menu/add", element: <AddFood base="/dashboard" /> },
      { path: "orders", Component: OwnerOrders },
      { path: "orders/:status", Component: OwnerOrders },
      { path: "stock", Component: OwnerStock },
      { path: "categories", Component: OwnerCategories },
      { path: "customers", Component: OwnerCustomers },
      { path: "reviews", Component: OwnerReviews },
      { path: "sales", Component: OwnerSales },
      { path: "coupons", Component: OwnerCoupons },
      { path: "reports", Component: OwnerReports },
      { path: "settings", Component: OwnerSettings },
      { path: "profile", Component: Manage },
    ],
  },

  // ------------------------------------------------------------------
  // Admin panel
  // ------------------------------------------------------------------
  {
    path: "/admin",
    Component: AdminPanel,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "dashboard", Component: AdminDashboard },
      { path: "orders", Component: AdminOrders },
      { path: "customers", Component: Customers },
      { path: "users", Component: Customers },
      { path: "restaurants", Component: AdminRestaurants },
      { path: "restaurants/requests", Component: RestaurantRequests },
      { path: "riders", Component: Riders },
      { path: "riders/requests", Component: RiderRequests },
      { path: "foods", Component: AdminFoods },
      { path: "categories", Component: AdminCategories },
      { path: "reviews", Component: AdminReviews },
      { path: "payments", Component: AdminPayments },
      { path: "coupons", Component: Coupons },
      { path: "reports", Component: AdminReports },
      { path: "analytics", Component: AdminAnalytics },
      { path: "notifications", Component: AdminNotifications },
      { path: "settings", Component: AdminSettings },
      { path: "requests", Component: RestaurantRequests },
      { path: "revenue", Component: RevenueDashboard },
      { path: "profile", Component: AdminProfile },
    ]
  },

  // ------------------------------------------------------------------
  // Role-based dashboard aliases (friendly URLs -> existing dashboards)
  // ------------------------------------------------------------------
  {
    path: "/restaurant-owner/dashboard",
    element: (
      <RequireApprovedRestaurant>
        <RequireAuth allowedRoles={[ROLES.restaurantOwner]}>
          <OwnerDashboardLayout />
        </RequireAuth>
      </RequireApprovedRestaurant>
    ),
    children: [{ index: true, Component: OwnerDashboard }],
  },
]);
