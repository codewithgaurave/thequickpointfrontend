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
  FaReceipt
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
];

export default routes;