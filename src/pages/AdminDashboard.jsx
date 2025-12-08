// src/pages/AdminDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import {
  FaUsers,
  FaStore,
  FaBoxOpen,
  FaTags,
  FaShoppingCart,
  FaRupeeSign,
  FaTachometerAlt,
  FaChartLine,
  FaCalendarAlt,
  FaUserCheck,
  FaUserTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaShoppingBag,
  FaRegClock,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { adminDashboardAPI, quickStatsAPI, analyticsAPI } from "../apis/dashboardApis";

// Helper function to format numbers with commas
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return new Intl.NumberFormat("en-IN").format(num);
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-2xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-200 dark:bg-gray-700 h-96 rounded-2xl"></div>
      <div className="bg-gray-200 dark:bg-gray-700 h-96 rounded-2xl"></div>
    </div>
    <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-2xl"></div>
  </div>
);

export default function AdminDashboard() {
  const { themeColors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activePeriod, setActivePeriod] = useState("month");
  const [error, setError] = useState(null);

  // Fetch all dashboard data
  useEffect(() => {
    let mounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [dashboardRes, quickStatsRes, analyticsRes] = await Promise.all([
          adminDashboardAPI(),
          quickStatsAPI(),
          analyticsAPI({ type: activePeriod }),
        ]);

        if (!mounted) return;

        setDashboardData(dashboardRes?.data || null);
        setQuickStats(quickStatsRes?.data || null);
        setAnalytics(analyticsRes?.data || null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        toast.error("Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      mounted = false;
    };
  }, [activePeriod]);

  // Handle period change
  const handlePeriodChange = (period) => {
    setActivePeriod(period);
  };

  // Prepare chart data
  const { revenueChartOptions, orderStatusChartOptions, categoryChartOptions } = useMemo(() => {
    if (!dashboardData || !dashboardData.dashboard) return {};

    // Revenue Chart (Weekly) - prefer dashboardData.dashboard.revenue.weeklyData
    const weeklyRevenueData = dashboardData.dashboard.revenue?.weeklyData || [];
    const revenueChartOptions = {
      chart: {
        type: "areaspline",
        backgroundColor: "transparent",
        style: {
          fontFamily: "inherit",
        },
      },
      title: {
        text: "Weekly Revenue Trend",
        style: {
          color: themeColors.text,
          fontWeight: "600",
        },
      },
      xAxis: {
        categories: weeklyRevenueData.map((d) => d.date),
        labels: {
          style: {
            color: themeColors.text,
          },
        },
        lineColor: themeColors.border,
        tickColor: themeColors.border,
      },
      yAxis: {
        title: {
          text: "Revenue (₹)",
          style: {
            color: themeColors.text,
          },
        },
        labels: {
          style: {
            color: themeColors.text,
          },
        },
        gridLineColor: themeColors.border + "30",
      },
      series: [
        {
          name: "Revenue",
          data: weeklyRevenueData.map((d) => d.revenue || 0),
          color: themeColors.primary,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, themeColors.primary + "60"],
              [1, themeColors.primary + "10"],
            ],
          },
          marker: {
            radius: 4,
          },
          lineWidth: 2,
        },
      ],
      legend: {
        itemStyle: {
          color: themeColors.text,
        },
      },
      tooltip: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        style: {
          color: themeColors.text,
        },
        valueDecimals: 0,
        valuePrefix: "₹",
      },
      credits: {
        enabled: false,
      },
    };

    // Order Status Chart
    const orderStatusData = dashboardData.dashboard.orders?.status || {};
    const orderStatusChartOptions = {
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
      },
      title: {
        text: "Order Status Distribution",
        style: {
          color: themeColors.text,
          fontWeight: "600",
        },
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "<b>{point.name}</b>: {point.percentage:.1f}%",
            style: {
              color: themeColors.text,
              textOutline: "none",
            },
          },
          colors: [
            "#FF6B6B", // Pending
            "#4ECDC4", // Confirmed
            "#45B7D1", // Shipped
            "#96CEB4", // Delivered
            "#FFEAA7", // Cancelled
          ],
        },
      },
      series: [
        {
          name: "Orders",
          colorByPoint: true,
          data: [
            { name: "Pending", y: orderStatusData.pending || 0 },
            { name: "Confirmed", y: orderStatusData.confirmed || 0 },
            { name: "Shipped", y: orderStatusData.shipped || 0 },
            { name: "Delivered", y: orderStatusData.delivered || 0 },
            { name: "Cancelled", y: orderStatusData.cancelled || 0 },
          ],
        },
      ],
      credits: { enabled: false },
    };

    // Category Performance Chart
    const categoryData = dashboardData.dashboard.analytics?.categoryPerformance || [];
    const categoryChartOptions = {
      chart: {
        type: "column",
        backgroundColor: "transparent",
      },
      title: {
        text: "Category Performance",
        style: {
          color: themeColors.text,
          fontWeight: "600",
        },
      },
      xAxis: {
        categories: categoryData.map((c) => c.category?.title || "Unknown"),
        labels: {
          style: {
            color: themeColors.text,
          },
        },
        lineColor: themeColors.border,
        tickColor: themeColors.border,
      },
      yAxis: {
        min: 0,
        title: {
          text: "Products",
          style: {
            color: themeColors.text,
          },
        },
        labels: {
          style: {
            color: themeColors.text,
          },
        },
        gridLineColor: themeColors.border + "30",
      },
      series: [
        {
          name: "Products",
          data: categoryData.map((c) => c.productCount || 0),
          color: themeColors.primary,
        },
      ],
      legend: { enabled: false },
      credits: { enabled: false },
    };

    return { revenueChartOptions, orderStatusChartOptions, categoryChartOptions };
  }, [dashboardData, themeColors]);

  // Prepare summary cards data
  const summaryCards = useMemo(() => {
    if (!dashboardData?.dashboard?.summary) return [];

    const summary = dashboardData.dashboard.summary;
    const revenue = dashboardData.dashboard.revenue || {};

    return [
      {
        title: "Total Users",
        value: formatNumber(summary.users?.total || 0),
        change: `${summary.users?.growth || 0}%`,
        icon: <FaUsers className="text-2xl" />,
        color: "bg-blue-500",
        iconColor: "text-blue-500",
        details: `${formatNumber(summary.users?.active || 0)} active, ${formatNumber(summary.users?.blocked || 0)} blocked`,
      },
      {
        title: "Total Stores",
        value: formatNumber(summary.stores?.total || 0),
        change: `${summary.stores?.growth || 0}%`,
        icon: <FaStore className="text-2xl" />,
        color: "bg-green-500",
        iconColor: "text-green-500",
        details: `${formatNumber(summary.stores?.active || 0)} active, ${formatNumber(summary.stores?.blocked || 0)} blocked`,
      },
      {
        title: "Total Products",
        value: formatNumber(summary.products?.total || 0),
        change: `${summary.products?.growth || 0}%`,
        icon: <FaBoxOpen className="text-2xl" />,
        color: "bg-purple-500",
        iconColor: "text-purple-500",
        details: `${formatNumber(summary.products?.active || 0)} active, ${formatNumber(summary.products?.blocked || 0)} blocked`,
      },
      {
        title: "Total Orders",
        value: formatNumber(summary.orders?.total || 0),
        change: `${summary.orders?.growth || 0}%`,
        icon: <FaShoppingCart className="text-2xl" />,
        color: "bg-orange-500",
        iconColor: "text-orange-500",
        details: `${formatNumber((dashboardData.dashboard.orders?.status?.delivered || 0))} delivered`,
      },
      {
        title: "Total Revenue",
        value: formatCurrency(revenue.total || 0),
        change: revenue.today ? `Today: ${formatCurrency(revenue.today || 0)}` : null,
        icon: <FaRupeeSign className="text-2xl" />,
        color: "bg-teal-500",
        iconColor: "text-teal-500",
        details: `Avg Order: ${formatCurrency(revenue.averageOrderValue || 0)}`,
      },
      {
        title: "Categories",
        value: formatNumber(summary.categories?.total || 0),
        change: `${summary.categories?.growth || 0}%`,
        icon: <FaTags className="text-2xl" />,
        color: "bg-pink-500",
        iconColor: "text-pink-500",
        details: `${formatNumber(summary.categories?.active || 0)} active`,
      },
    ];
  }, [dashboardData]);

  // Prepare alert cards
  const alertCards = useMemo(() => {
    if (!dashboardData?.dashboard?.alerts) return [];

    const alerts = dashboardData.dashboard.alerts;

    return [
      {
        title: "Low Stock Products",
        value: alerts.lowStockProducts || 0,
        icon: <FaExclamationTriangle className="text-lg" />,
        color: "bg-red-500",
        severity: alerts.lowStockProducts > 10 ? "high" : alerts.lowStockProducts > 5 ? "medium" : "low",
      },
      {
        title: "Pending Orders",
        value: (dashboardData.dashboard.orders?.status?.pending || 0) + (dashboardData.dashboard.orders?.payment?.pending || 0),
        icon: <FaRegClock className="text-lg" />,
        color: "bg-yellow-500",
        severity: "medium",
      },
      {
        title: "Blocked Users",
        value: alerts.blockedUsers || 0,
        icon: <FaUserTimes className="text-lg" />,
        color: "bg-red-500",
        severity: "low",
      },
      {
        title: "Successful Orders",
        value: dashboardData.dashboard.orders?.status?.delivered || 0,
        icon: <FaCheckCircle className="text-lg" />,
        color: "bg-green-500",
        severity: "success",
      },
    ];
  }, [dashboardData]);

  // Recent activities
  const recentActivities = useMemo(() => {
    if (!dashboardData?.dashboard?.recentActivities) return [];

    const activities = dashboardData.dashboard.recentActivities;
    const allActivities = [
      ...(activities.users?.slice(0, 3) || []).map((user) => ({
        type: "user",
        title: "New User Registered",
        description: user.fullName || user.mobile,
        time: user.createdAtIST || user.createdAt || null,
        icon: <FaUserCheck />,
      })),
      ...(activities.stores?.slice(0, 2) || []).map((store) => ({
        type: "store",
        title: "New Store Added",
        description: store.storeName,
        time: store.createdAtIST || store.createdAt || null,
        icon: <FaStore />,
      })),
      ...(activities.products?.slice(0, 2) || []).map((product) => ({
        type: "product",
        title: "New Product Added",
        description: product.name,
        time: product.createdAtIST || product.createdAt || null,
        icon: <FaBoxOpen />,
      })),
    ];

    return allActivities
      .filter((a) => a.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 6);
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaTachometerAlt />
            Admin Dashboard
          </h1>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Overview of your e-commerce platform performance
          </p>
        </div>

        <div className="flex gap-2">
          {["day", "week", "month", "year"].map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activePeriod === period
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className="rounded-2xl p-4 border shadow-sm"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                <div className={card.iconColor}>{card.icon}</div>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  card.change?.includes("-")
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                }`}
              >
                {card.change}
              </span>
            </div>
            <h3 className="text-sm font-medium opacity-75 mb-1" style={{ color: themeColors.text }}>
              {card.title}
            </h3>
            <p className="text-2xl font-bold mb-2" style={{ color: themeColors.text }}>
              {card.value}
            </p>
            <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
              {card.details}
            </p>
          </div>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alertCards.map((alert, index) => (
          <div
            key={index}
            className="rounded-2xl p-4 border shadow-sm"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${alert.color} bg-opacity-10`}>
                <div className={`${alert.color.replace("bg-", "text-")}`}>{alert.icon}</div>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  alert.severity === "high"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : alert.severity === "medium"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : alert.severity === "success"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                }`}
              >
                {alert.severity === "high" ? "High" : alert.severity === "medium" ? "Medium" : alert.severity === "success" ? "Success" : "Low"}
              </span>
            </div>
            <h3 className="text-sm font-medium opacity-75 mb-1" style={{ color: themeColors.text }}>
              {alert.title}
            </h3>
            <p className="text-2xl font-bold" style={{ color: themeColors.text }}>
              {alert.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: themeColors.text }}>
              Revenue Analytics
            </h3>
            <FaChartLine className="opacity-60" style={{ color: themeColors.text }} />
          </div>
          {revenueChartOptions ? (
            <HighchartsReact highcharts={Highcharts} options={revenueChartOptions} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p style={{ color: themeColors.text }}>No revenue data available</p>
            </div>
          )}
        </div>

        {/* Order Status Chart */}
        <div className="rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: themeColors.text }}>
              Order Status
            </h3>
            <FaShoppingCart className="opacity-60" style={{ color: themeColors.text }} />
          </div>
          {orderStatusChartOptions ? <HighchartsReact highcharts={Highcharts} options={orderStatusChartOptions} /> : <div className="h-64 flex items-center justify-center"><p style={{ color: themeColors.text }}>No order data available</p></div>}
        </div>
      </div>

      {/* Category Performance and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: themeColors.text }}>
              Category Performance
            </h3>
            <FaTags className="opacity-60" style={{ color: themeColors.text }} />
          </div>
          {categoryChartOptions ? <HighchartsReact highcharts={Highcharts} options={categoryChartOptions} /> : <div className="h-64 flex items-center justify-center"><p style={{ color: themeColors.text }}>No category data available</p></div>}
        </div>

        {/* Recent Activities */}
        <div className="rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: themeColors.text }}>
              Recent Activities
            </h3>
            <FaCalendarAlt className="opacity-60" style={{ color: themeColors.text }} />
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                  }}
                >
                  <div className="p-2 rounded-lg bg-opacity-10" style={{ backgroundColor: themeColors.primary + "20" }}>
                    <div style={{ color: themeColors.primary }}>{activity.icon}</div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: themeColors.text }}>
                      {activity.title}
                    </p>
                    <p className="text-xs opacity-75" style={{ color: themeColors.text }}>
                      {activity.description}
                    </p>
                  </div>
                  <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
                    {activity.time ? formatDate(activity.time) : "-"}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="opacity-60" style={{ color: themeColors.text }}>
                  No recent activities
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {quickStats && (
        <div className="rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>
                {formatNumber(quickStats.stats?.users?.total || 0)}
              </p>
              <p className="text-sm opacity-75" style={{ color: themeColors.text }}>
                Total Users
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>
                {formatNumber(quickStats.stats?.orders?.total || 0)}
              </p>
              <p className="text-sm opacity-75" style={{ color: themeColors.text }}>
                Total Orders
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>
                {formatCurrency(quickStats.stats?.revenue?.month || 0)}
              </p>
              <p className="text-sm opacity-75" style={{ color: themeColors.text }}>
                Monthly Revenue
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>
                {formatNumber(quickStats.stats?.alerts?.lowStock || 0)}
              </p>
              <p className="text-sm opacity-75" style={{ color: themeColors.text }}>
                Low Stock Alerts
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
