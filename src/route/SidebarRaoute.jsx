// src/routes/index.jsx
import { lazy } from "react";
import { 
  FaUsers, 
  FaTachometerAlt, 
  FaImages, 
  FaPercent, 
  FaFont,
  FaFolder,
  FaBox,
  FaStore,
  FaShoppingCart,
  FaReceipt,
  FaMotorcycle,
  FaUserTie,
  FaTruck,
  FaMobile
} from "react-icons/fa";

const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const Users = lazy(() => import("../pages/Users"));
const Sliders = lazy(() => import("../pages/Sliders"));
const OfferImages = lazy(() => import("../pages/OfferImages"));
const OfferTexts = lazy(() => import("../pages/OfferTexts"));
const Categories = lazy(() => import("../pages/Categories"));
const Products = lazy(() => import("../pages/Products"));
const Stores = lazy(() => import("../pages/Stores"));
const Orders = lazy(() => import("../pages/Orders"));
const DeliveryBoys = lazy(() => import("../pages/DeliveryBoys"));
const AppVersions = lazy(() => import("../pages/AppVersions"));

const routes = [
  {
    path: "/dashboard",
    component: AdminDashboard,
    name: "Dashboard",
    icon: FaTachometerAlt,
  },
  {
    path: "/orders",
    component: Orders,
    name: "Orders",
    icon: FaShoppingCart,
  },
  {
    path: "/users",
    component: Users,
    name: "Users",
    icon: FaUsers,
  },
  {
    path: "/categories",
    component: Categories,
    name: "Categories",
    icon: FaFolder,
  },
  {
    path: "/products",
    component: Products,
    name: "Products",
    icon: FaBox,
  },
  {
    path: "/stores",
    component: Stores,
    name: "Stores",
    icon: FaStore,
  },
  {
    path: "/delivery-boys",
    component: DeliveryBoys,
    name: "Delivery Boys",
    icon: FaMotorcycle,
    // Alternative icons you could use:
    // FaUserTie (for delivery personnel)
    // FaTruck (for delivery vehicle)
    // FaShippingFast (if available)
  },
  {
    path: "/sliders",
    component: Sliders,
    name: "Sliders",
    icon: FaImages,
  },
  {
    path: "/offer-images",
    component: OfferImages,
    name: "Offer Images",
    icon: FaPercent,
  },
  {
    path: "/offer-texts",
    component: OfferTexts,
    name: "Offer Texts",
    icon: FaFont,
  },
  {
    path: "/app-versions",
    component: AppVersions,
    name: "App Versions",
    icon: FaMobile,
  },
];

export default routes;