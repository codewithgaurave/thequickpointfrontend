// src/pages/Orders.jsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSync,
  FaCalendar,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaStore,
  FaGlobe,
  FaRupeeSign,
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardCheck,
  FaCreditCard,
  FaMoneyBillWave,
  FaReceipt,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCopy,
  FaPrint,
  FaDownload,
  FaExclamationTriangle,
  FaCheck,
  FaClock,
  FaShippingFast,
  FaBan,
  FaListAlt,
  FaShoppingCart,
  FaPercentage,
  FaTag,
  FaUserCircle,
  FaHistory,
  FaList
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  getAllOrdersAPI,
  getOrderByIdAPI,
  updateOrderStatusAPI,
  updatePaymentStatusAPI,
  deleteOrderAPI,
  getOrderStatsAPI,
  getUserOrdersAPI
} from "../apis/orderApi";

const MySwal = withReactContent(Swal);

export default function Orders() {
  const { themeColors } = useTheme();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
    avgOrderValue: 0
  });

  // User orders state
  const [userOrders, setUserOrders] = useState([]);
  const [showUserOrders, setShowUserOrders] = useState(false);
  const [userOrdersLoading, setUserOrdersLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAllOrdersAPI();
      const ordersData = res?.data?.orders || [];
      const counts = res?.data?.counts || {};
      const organized = res?.data?.organized || {};
      
      // Combine global and store orders
      const allOrders = [
        ...(organized.globalOrders || []),
        ...(organized.storeOrders || [])
      ];
      
      setOrders(allOrders);
      setFilteredOrders(allOrders);
      
      // Calculate stats
      calculateStats(allOrders, counts);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user orders - FIXED VERSION
  const fetchUserOrders = async (userId) => {
    try {
      setUserOrdersLoading(true);
      console.log("Fetching orders for user:", userId);
      
      const res = await getUserOrdersAPI(userId);
      console.log("User orders API response:", res);
      
      const userOrdersData = res?.data?.orders || [];
      console.log("User orders data:", userOrdersData);
      
      // Set user orders state immediately
      setUserOrders(userOrdersData);
      setCurrentUserId(userId);
      
      // Calculate stats for user orders
      const userStats = {
        total: userOrdersData.length,
        pending: userOrdersData.filter(o => o.status === 'pending').length,
        confirmed: userOrdersData.filter(o => o.status === 'confirmed').length,
        shipped: userOrdersData.filter(o => o.status === 'shipped').length,
        delivered: userOrdersData.filter(o => o.status === 'delivered').length,
        cancelled: userOrdersData.filter(o => o.status === 'cancelled').length,
        revenue: userOrdersData.reduce((sum, order) => sum + (order.grandTotal || 0), 0),
        avgOrderValue: userOrdersData.length > 0 ? 
          userOrdersData.reduce((sum, order) => sum + (order.grandTotal || 0), 0) / userOrdersData.length : 0
      };
      
      console.log("User stats calculated:", userStats);
      
      // Return both data and stats
      return {
        orders: userOrdersData,
        stats: userStats
      };
      
    } catch (err) {
      console.error("Error fetching user orders:", err);
      console.error("Error details:", err.response?.data || err.message);
      
      // Fallback: Filter from existing orders
      const filteredUserOrders = orders.filter(order => {
        const orderUserId = order.user?._id || order.user;
        return orderUserId === userId;
      });
      
      console.log("Fallback filtered orders:", filteredUserOrders.length);
      
      // Set user orders state immediately
      setUserOrders(filteredUserOrders);
      setCurrentUserId(userId);
      
      toast.warning("Using local orders data");
      
      // Calculate fallback stats
      const userStats = {
        total: filteredUserOrders.length,
        pending: filteredUserOrders.filter(o => o.status === 'pending').length,
        confirmed: filteredUserOrders.filter(o => o.status === 'confirmed').length,
        shipped: filteredUserOrders.filter(o => o.status === 'shipped').length,
        delivered: filteredUserOrders.filter(o => o.status === 'delivered').length,
        cancelled: filteredUserOrders.filter(o => o.status === 'cancelled').length,
        revenue: filteredUserOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0),
        avgOrderValue: filteredUserOrders.length > 0 ? 
          filteredUserOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0) / filteredUserOrders.length : 0
      };
      
      return {
        orders: filteredUserOrders,
        stats: userStats
      };
    } finally {
      setUserOrdersLoading(false);
    }
  };

  const calculateStats = (orders, counts) => {
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    let totalRevenue = 0;
    
    orders.forEach(order => {
      if (order.status) {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      }
      if (order.grandTotal) {
        totalRevenue += order.grandTotal;
      }
    });
    
    setStats({
      total: orders.length,
      ...statusCounts,
      revenue: totalRevenue,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
    });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...orders];
    
    // Apply search filter
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(order => {
        return (
          (order._id && order._id.toLowerCase().includes(query)) ||
          (order.user?.fullName && order.user.fullName.toLowerCase().includes(query)) ||
          (order.user?.mobile && order.user.mobile.includes(query)) ||
          (order.user?.email && order.user.email.toLowerCase().includes(query)) ||
          (order.shippingAddress?.city && order.shippingAddress.city.toLowerCase().includes(query)) ||
          (order.status && order.status.toLowerCase().includes(query))
        );
      });
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply payment status filter
    if (paymentStatusFilter !== "all") {
      result = result.filter(order => order.paymentStatus === paymentStatusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      if (typeFilter === "global") {
        result = result.filter(order => !order.store);
      } else if (typeFilter === "store") {
        result = result.filter(order => order.store);
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "date_asc":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "total_desc":
          return (b.grandTotal || 0) - (a.grandTotal || 0);
        case "total_asc":
          return (a.grandTotal || 0) - (b.grandTotal || 0);
        default:
          return 0;
      }
    });
    
    setFilteredOrders(result);
  }, [search, statusFilter, paymentStatusFilter, typeFilter, sortBy, orders]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", icon: <FaClock className="mr-1" /> };
      case "confirmed":
        return { bg: "bg-blue-100", text: "text-blue-800", icon: <FaCheckCircle className="mr-1" /> };
      case "shipped":
        return { bg: "bg-purple-100", text: "text-purple-800", icon: <FaShippingFast className="mr-1" /> };
      case "delivered":
        return { bg: "bg-green-100", text: "text-green-800", icon: <FaCheck className="mr-1" /> };
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-800", icon: <FaBan className="mr-1" /> };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", icon: <FaClock className="mr-1" /> };
    }
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return { bg: "bg-green-100", text: "text-green-800", icon: <FaCheckCircle className="mr-1" /> };
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", icon: <FaClock className="mr-1" /> };
      case "failed":
        return { bg: "bg-red-100", text: "text-red-800", icon: <FaTimesCircle className="mr-1" /> };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", icon: <FaClock className="mr-1" /> };
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "cod":
        return <FaMoneyBillWave className="mr-1" />;
      case "card":
        return <FaCreditCard className="mr-1" />;
      case "upi":
        return <FaRupeeSign className="mr-1" />;
      default:
        return <FaMoneyBillWave className="mr-1" />;
    }
  };

  // View order details with user's all orders - FIXED VERSION
  const viewOrderDetails = async (order) => {
    try {
      setSelectedOrder(order);
      setActionLoading(true);
      
      // Get order details
      const res = await getOrderByIdAPI(order._id);
      const orderData = res?.data?.order || order;
      setOrderDetails(orderData);
      
      // Fetch user's all orders
      const userId = order.user?._id || order.user;
      console.log("View order details - User ID:", userId);
      
      if (userId) {
        // Reset and show loading
        setShowUserOrders(true);
        
        // Fetch user orders FIRST
        const userData = await fetchUserOrders(userId);
        
        // Create and show modal AFTER fetching user orders
        createAndShowModal(order, userId, true, userData.orders, userData.stats);
      } else {
        console.warn("No user ID found for order");
        setShowUserOrders(false);
        createAndShowModal(order, null, false, [], null);
      }
      
    } catch (err) {
      console.error("Error fetching order details:", err);
      toast.error("Failed to load order details");
      // Show modal even if there's an error
      const userId = order.user?._id || order.user;
      createAndShowModal(order, userId, false, [], null);
    } finally {
      setActionLoading(false);
    }
  };

  // Separate function to create and show modal - UPDATED
  const createAndShowModal = (order, userId, showUserOrdersSection, userOrdersData = [], userStats = null) => {
    const modalContent = (
      <div className="text-left space-y-6" style={{ color: themeColors.text }}>
        {/* Order Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaReceipt className="mr-2" />
              Order Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="opacity-70">Order ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{order._id?.substring(0, 10)}...</span>
                  <button
                    onClick={() => copyToClipboard(order._id)}
                    className="p-1 rounded hover:opacity-80"
                    style={{ backgroundColor: themeColors.primary + '20' }}
                    title="Copy Order ID"
                  >
                    <FaCopy size={12} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Date:</span>
                <span>{order.createdAtIST || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Order Type:</span>
                <div className="flex items-center">
                  {order.store ? (
                    <>
                      <FaStore className="mr-1" />
                      <span>Store Order</span>
                    </>
                  ) : (
                    <>
                      <FaGlobe className="mr-1" />
                      <span>Global Order</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaUser className="mr-2" />
              Customer Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="opacity-70">Name:</span>
                <span className="font-medium">{order.user?.fullName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Mobile:</span>
                <div className="flex items-center gap-2">
                  <FaPhone size={12} />
                  <span>{order.user?.mobile || 'N/A'}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Email:</span>
                <div className="flex items-center gap-2">
                  <FaEnvelope size={12} />
                  <span className="truncate">{order.user?.email || 'N/A'}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">User ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{order.user?._id?.substring(0, 10) || 'N/A'}...</span>
                  {order.user?._id && (
                    <button
                      onClick={() => copyToClipboard(order.user._id)}
                      className="p-1 rounded hover:opacity-80"
                      style={{ backgroundColor: themeColors.primary + '20' }}
                      title="Copy User ID"
                    >
                      <FaCopy size={10} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Order History - FIXED SECTION */}
        {showUserOrdersSection && (
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaHistory className="mr-2" />
              User's Order History ({userOrdersData.length} orders)
            </h3>
            
            {userOrdersLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: themeColors.primary }}></div>
                <p className="mt-2 text-sm opacity-70">Loading user orders...</p>
              </div>
            ) : userOrdersData.length > 0 ? (
              <div className="space-y-4">
                {/* User Order Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-3 rounded-lg border text-center" style={{ borderColor: themeColors.border }}>
                    <p className="text-xs opacity-70">Total Orders</p>
                    <p className="text-xl font-bold">{userOrdersData.length}</p>
                  </div>
                  <div className="p-3 rounded-lg border text-center" style={{ borderColor: themeColors.border }}>
                    <p className="text-xs opacity-70">Total Spent</p>
                    <p className="text-xl font-bold">₹{userOrdersData.reduce((sum, o) => sum + (o.grandTotal || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg border text-center" style={{ borderColor: themeColors.border }}>
                    <p className="text-xs opacity-70">Avg. Order</p>
                    <p className="text-xl font-bold">₹{userOrdersData.length > 0 ? (userOrdersData.reduce((sum, o) => sum + (o.grandTotal || 0), 0) / userOrdersData.length).toFixed(0) : 0}</p>
                  </div>
                  <div className="p-3 rounded-lg border text-center" style={{ borderColor: themeColors.border }}>
                    <p className="text-xs opacity-70">Current Order</p>
                    <p className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                      {order.status}
                    </p>
                  </div>
                </div>

                {/* User Orders List */}
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: themeColors.background }}>
                        <th className="text-left p-2 font-medium">Order ID</th>
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Amount</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userOrdersData.map((userOrder) => (
                        <tr 
                          key={userOrder._id} 
                          className={`border-t ${userOrder._id === order._id ? 'bg-blue-50' : ''}`} 
                          style={{ borderColor: themeColors.border }}
                        >
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">{userOrder._id?.substring(0, 8)}...</span>
                              {userOrder._id === order._id && (
                                <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded">Current</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            {userOrder.createdAtIST?.split(',')[0]}
                          </td>
                          <td className="p-2 font-medium">
                            ₹{userOrder.grandTotal}
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(userOrder.status).bg} ${getStatusColor(userOrder.status).text}`}>
                              {userOrder.status}
                            </span>
                          </td>
                          <td className="p-2">
                            {userOrder.store ? (
                              <span className="text-xs flex items-center">
                                <FaStore size={10} className="mr-1" />
                                Store
                              </span>
                            ) : (
                              <span className="text-xs flex items-center">
                                <FaGlobe size={10} className="mr-1" />
                                Global
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm opacity-70">No other orders found for this user.</p>
                <p className="text-xs opacity-50 mt-1">This is their first order.</p>
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <FaShoppingCart className="mr-2" />
            Order Items ({order.items?.length || 0})
          </h3>
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={item._id || index} className="flex items-center gap-4 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
                {item.images?.[0] && (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/100?text=No+Image";
                    }}
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex items-center gap-2">
                      {item.percentageOff > 0 && (
                        <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
                          <FaTag className="inline mr-1" />
                          {item.percentageOff}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Quantity:</span>
                        <span className="font-medium">{item.quantity} {item.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Price:</span>
                        <div className="flex items-center gap-2">
                          {item.offerPrice !== item.price ? (
                            <>
                              <span className="line-through opacity-70">₹{item.price}</span>
                              <span className="font-bold text-green-600">₹{item.offerPrice}</span>
                            </>
                          ) : (
                            <span className="font-medium">₹{item.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="opacity-70 text-xs">Line Total</div>
                      <div className="text-lg font-bold">₹{item.lineTotal || item.offerPrice * item.quantity}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaRupeeSign className="mr-2" />
              Price Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="opacity-70">Subtotal:</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Total Discount:</span>
                <span className="text-green-600">-₹{order.totalDiscount}</span>
              </div>
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: themeColors.border }}>
                <span className="font-bold">Grand Total:</span>
                <span className="text-xl font-bold">₹{order.grandTotal}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaClipboardCheck className="mr-2" />
              Order Status
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="opacity-70">Order Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                    {getStatusColor(order.status).icon}
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </span>
                </div>
                <select
                  id="swal-status-select"
                  className="w-full p-2 rounded-lg border text-sm"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                  defaultValue={order.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    MySwal.fire({
                      title: 'Update Order Status',
                      text: `Change status to ${newStatus}?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonText: 'Update',
                      cancelButtonText: 'Cancel',
                      confirmButtonColor: themeColors.primary,
                      cancelButtonColor: themeColors.border,
                      background: themeColors.background
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        try {
                          setActionLoading(true);
                          await updateOrderStatusAPI(order._id, newStatus);
                          toast.success(`Order status updated to ${newStatus}`);
                          fetchOrders();
                          // Refresh user orders if showing
                          if (showUserOrdersSection && userId) {
                            await fetchUserOrders(userId);
                          }
                        } catch (err) {
                          console.error("Error updating status:", err);
                          toast.error("Failed to update status");
                        } finally {
                          setActionLoading(false);
                        }
                      }
                    });
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaCreditCard className="mr-2" />
              Payment Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="opacity-70">Method:</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center bg-gray-100 text-gray-800`}>
                  {getPaymentMethodIcon(order.paymentMethod)}
                  {order.paymentMethod?.toUpperCase() || 'COD'}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Status:</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${getPaymentStatusColor(order.paymentStatus).bg} ${getPaymentStatusColor(order.paymentStatus).text}`}>
                  {getPaymentStatusColor(order.paymentStatus).icon}
                  {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                </div>
              </div>
              {order.paymentStatus === 'pending' && (
                <button
                  onClick={() => updatePaymentStatus(order, 'paid')}
                  className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: themeColors.primary, color: 'white' }}
                >
                  Mark as Paid
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaMapMarkerAlt className="mr-2" />
              Shipping Address
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="opacity-70 text-sm">Name</p>
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                </div>
                <div>
                  <p className="opacity-70 text-sm">Mobile</p>
                  <p className="font-medium">{order.shippingAddress.mobile}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="opacity-70 text-sm">Address</p>
                  <p className="font-medium">
                    {order.shippingAddress.addressLine1}, {order.shippingAddress.addressLine2}
                  </p>
                  <p className="font-medium">
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                </div>
                {order.shippingAddress.landmark && (
                  <div className="md:col-span-2">
                    <p className="opacity-70 text-sm">Landmark</p>
                    <p className="font-medium">{order.shippingAddress.landmark}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaExclamationTriangle className="mr-2" />
              Order Notes
            </h3>
            <p className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              {order.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowUserOrders(false);
              MySwal.close();
            }}
            className="px-4 py-2 rounded-lg border text-sm font-medium"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }}
          >
            Close
          </button>
          <button
            onClick={() => printOrder(order)}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
          >
            <FaPrint size={14} />
            Print Invoice
          </button>
        </div>
      </div>
    );

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Order Details</div>,
      html: modalContent,
      showConfirmButton: false,
      showCloseButton: true,
      width: '900px',
      background: themeColors.background,
      didClose: () => {
        setShowUserOrders(false);
        setCurrentUserId(null);
      }
    });
  };

  // Update payment status
  const updatePaymentStatus = async (order, newStatus) => {
    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Update Payment Status</div>,
      html: <div style={{ color: themeColors.text }}>
        Change payment status to <strong>{newStatus.toUpperCase()}</strong>?
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <p className="font-bold">Order #{order._id?.substring(0, 8)}...</p>
          <p className="text-lg font-bold mt-2">Amount: ₹{order.grandTotal}</p>
          <p className="text-sm opacity-70">Customer: {order.user?.fullName}</p>
        </div>
      </div>,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update Status',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary,
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await updatePaymentStatusAPI(order._id, newStatus);
        toast.success(`Payment status updated to ${newStatus}`);
        fetchOrders();
      } catch (err) {
        console.error("Error updating payment status:", err);
        toast.error("Failed to update payment status");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Delete order
  const deleteOrder = async (order) => {
    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Order</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this order?</p>
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="space-y-2">
            <p className="font-bold">Order #{order._id?.substring(0, 10)}...</p>
            <p>Customer: {order.user?.fullName}</p>
            <p>Amount: <span className="font-bold">₹{order.grandTotal}</span></p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                {order.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(order.paymentStatus).bg} ${getPaymentStatusColor(order.paymentStatus).text}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm text-red-500 mt-2">
          ⚠️ Warning: Deleting this order will remove it from the system.
        </p>
      </div>,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await deleteOrderAPI(order._id);
        toast.success("Order deleted successfully");
        fetchOrders();
      } catch (err) {
        console.error("Error deleting order:", err);
        toast.error("Failed to delete order");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy text");
    });
  };

  // Export orders
  const exportOrders = () => {
    const data = filteredOrders.map(order => ({
      "Order ID": order._id,
      "Date": order.createdAtIST,
      "Customer": order.user?.fullName,
      "Mobile": order.user?.mobile,
      "Email": order.user?.email,
      "Items": order.items?.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', '),
      "Subtotal": order.subtotal,
      "Discount": order.totalDiscount,
      "Total": order.grandTotal,
      "Status": order.status,
      "Payment Status": order.paymentStatus,
      "Payment Method": order.paymentMethod,
      "City": order.shippingAddress?.city,
      "Order Type": order.store ? "Store" : "Global"
    }));
    
    // Create CSV
    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Orders exported successfully!");
  };

  // Print order summary
  const printOrder = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Invoice - ${order._id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .total { font-size: 1.2em; font-weight: bold; }
            .item { border-bottom: 1px solid #eee; padding: 10px 0; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>Order Invoice</h1>
              <p>Date: ${order.createdAtIST}</p>
              <p>Order ID: ${order._id}</p>
            </div>
            <div class="section">
              <h3>Customer Information</h3>
              <p>Name: ${order.user?.fullName}</p>
              <p>Mobile: ${order.user?.mobile}</p>
              <p>Email: ${order.user?.email}</p>
            </div>
            <div class="section">
              <h3>Order Items</h3>
              ${order.items?.map(item => `
                <div class="item">
                  <p><strong>${item.name}</strong> (${item.quantity} ${item.unit})</p>
                  <p>Price: ₹${item.offerPrice} each (₹${item.lineTotal} total)</p>
                </div>
              `).join('')}
            </div>
            <div class="section grid">
              <div>
                <h3>Order Summary</h3>
                <p>Subtotal: ₹${order.subtotal}</p>
                <p>Discount: -₹${order.totalDiscount}</p>
                <p class="total">Grand Total: ₹${order.grandTotal}</p>
              </div>
              <div>
                <h3>Status</h3>
                <p>Order Status: ${order.status}</p>
                <p>Payment Status: ${order.paymentStatus}</p>
                <p>Payment Method: ${order.paymentMethod}</p>
              </div>
            </div>
            <div class="section no-print">
              <button onclick="window.print()">Print Invoice</button>
              <button onclick="window.close()">Close</button>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Orders Management
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            View and manage all customer orders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 rounded-xl border w-full md:w-64"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }}
            />
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl border flex items-center gap-2"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
            title="Refresh"
            disabled={loading}
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={exportOrders}
            className="p-2 rounded-xl border flex items-center gap-2"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
            title="Export Orders"
            disabled={filteredOrders.length === 0}
          >
            <FaDownload />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="rounded-xl p-3 border col-span-2" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70" style={{ color: themeColors.text }}>Total Orders</p>
              <p className="text-xl md:text-2xl font-bold" style={{ color: themeColors.text }}>{stats.total}</p>
            </div>
            <div className="p-2 rounded-full" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
              <FaReceipt size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70" style={{ color: themeColors.text }}>Pending</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-2 rounded-full" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
              <FaClock size={16} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70" style={{ color: themeColors.text }}>Confirmed</p>
              <p className="text-xl font-bold text-blue-600">{stats.confirmed}</p>
            </div>
            <div className="p-2 rounded-full" style={{ backgroundColor: '#3B82F620', color: '#3B82F6' }}>
              <FaCheckCircle size={16} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70" style={{ color: themeColors.text }}>Shipped</p>
              <p className="text-xl font-bold text-purple-600">{stats.shipped}</p>
            </div>
            <div className="p-2 rounded-full" style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}>
              <FaTruck size={16} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70" style={{ color: themeColors.text }}>Delivered</p>
              <p className="text-xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <div className="p-2 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <FaCheck size={16} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70" style={{ color: themeColors.text }}>Cancelled</p>
              <p className="text-xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <div className="p-2 rounded-full" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>
              <FaBan size={16} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border col-span-2" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70" style={{ color: themeColors.text }}>Revenue</p>
              <p className="text-xl font-bold" style={{ color: themeColors.text }}>₹{stats.revenue.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <FaRupeeSign size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }}
          >
            <option value="all">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }}
          >
            <option value="all">All Types</option>
            <option value="global">Global Orders</option>
            <option value="store">Store Orders</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="total_desc">Highest Amount</option>
            <option value="total_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaReceipt className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Orders Found</h3>
          <p className="opacity-70" style={{ color: themeColors.text }}>
            {search ? `No orders match "${search}"` : "No orders have been placed yet"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: themeColors.background }}>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Order ID</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Customer</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Items</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Amount</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Status</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Payment</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Date</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr 
                    key={order._id || index} 
                    className={`border-t hover:bg-opacity-50 ${index % 2 === 0 ? '' : ''}`} 
                    style={{ borderColor: themeColors.border, backgroundColor: index % 2 === 0 ? themeColors.background + '30' : 'transparent' }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-mono text-xs" style={{ color: themeColors.text }}>
                            {order._id?.substring(0, 10)}...
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {order.store ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 inline-flex items-center">
                                <FaStore size={10} className="mr-1" />
                                Store
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 inline-flex items-center">
                                <FaGlobe size={10} className="mr-1" />
                                Global
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium" style={{ color: themeColors.text }}>{order.user?.fullName}</p>
                        <p className="text-xs opacity-70" style={{ color: themeColors.text }}>{order.user?.mobile}</p>
                        <p className="text-xs truncate max-w-[150px]" style={{ color: themeColors.text }}>
                          {order.shippingAddress?.city || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium" style={{ color: themeColors.text }}>
                          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs opacity-70 truncate max-w-[200px]" style={{ color: themeColors.text }}>
                          {order.items?.map(item => item.name).join(', ')}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-lg" style={{ color: themeColors.text }}>₹{order.grandTotal}</p>
                        {order.totalDiscount > 0 && (
                          <p className="text-xs text-green-600">-₹{order.totalDiscount} discount</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                        {getStatusColor(order.status).icon}
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${getPaymentStatusColor(order.paymentStatus).bg} ${getPaymentStatusColor(order.paymentStatus).text}`}>
                          {getPaymentStatusColor(order.paymentStatus).icon}
                          {order.paymentStatus}
                        </span>
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(order.paymentMethod)}
                          <span className="text-xs opacity-70">{order.paymentMethod}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm" style={{ color: themeColors.text }}>
                        {order.createdAtIST?.split(',')[0]}
                      </p>
                      <p className="text-xs opacity-70" style={{ color: themeColors.text }}>
                        {order.createdAtIST?.split(',')[1]?.trim()}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="p-2 rounded-lg hover:opacity-80 transition-colors"
                          style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                          title="View Details"
                          disabled={actionLoading}
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          onClick={() => printOrder(order)}
                          className="p-2 rounded-lg hover:opacity-80 transition-colors"
                          style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}
                          title="Print Invoice"
                        >
                          <FaPrint size={14} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(order._id)}
                          className="p-2 rounded-lg hover:opacity-80 transition-colors"
                          style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                          title="Copy Order ID"
                        >
                          <FaCopy size={14} />
                        </button>
                        <button
                          onClick={() => deleteOrder(order)}
                          className="p-2 rounded-lg hover:opacity-80 transition-colors text-red-500"
                          style={{ backgroundColor: '#EF444420' }}
                          title="Delete Order"
                          disabled={actionLoading}
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm opacity-70" style={{ color: themeColors.text }}>
        <p>
          Showing {filteredOrders.length} of {orders.length} orders •
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '—'}
        </p>
      </div>
    </div>
  );
}