"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AdminLayout from "../../../components/admin/AdminLayout";
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BellIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "@heroicons/react/24/outline";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("30");

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
    }).format(amount || 0);
  };

  const formatGrowth = (growth) => {
    if (!growth) return "0%";
    const isPositive = growth > 0;
    return (
      <span className={`flex items-center ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? (
          <TrendingUpIcon className="h-4 w-4 mr-1" />
        ) : (
          <TrendingDownIcon className="h-4 w-4 mr-1" />
        )}
        {Math.abs(growth).toFixed(1)}%
      </span>
    );
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    {
      name: "Total Revenue",
      value: formatCurrency(analytics?.orderStats?.totalRevenue),
      change: formatGrowth(analytics?.growthMetrics?.revenueGrowth),
      icon: CurrencyDollarIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Total Orders",
      value: analytics?.orderStats?.totalOrders || 0,
      change: formatGrowth(analytics?.growthMetrics?.ordersGrowth),
      icon: ShoppingBagIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "New Customers",
      value: analytics?.customerStats?.totalCustomers || 0,
      change: "+12.5%",
      icon: UsersIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "Pending Reviews",
      value: (analytics?.orderStats?.pendingOrders || 0) + (analytics?.orderStats?.suspiciousOrders || 0),
      change: analytics?.orderStats?.suspiciousOrders > 0 ? "Attention needed" : "All clear",
      icon: ExclamationTriangleIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  // Prepare chart data
  const dailyTrendsData = {
    labels: analytics?.dailyTrends?.map(d => new Date(d._id.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: "Orders",
        data: analytics?.dailyTrends?.map(d => d.orders) || [],
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
      },
      {
        label: "Revenue (NZD)",
        data: analytics?.dailyTrends?.map(d => d.revenue) || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const currencyData = {
    labels: analytics?.currencyStats?.map(c => c._id) || [],
    datasets: [
      {
        label: "Volume",
        data: analytics?.currencyStats?.map(c => c.volume) || [],
        backgroundColor: [
          "rgba(99, 102, 241, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 146, 60, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
      },
    ],
  };

  const orderStatusData = {
    labels: ["Pending", "Processing", "Completed", "Cancelled"],
    datasets: [
      {
        data: [
          analytics?.orderStats?.pendingOrders || 0,
          analytics?.orderStats?.processingOrders || 0,
          analytics?.orderStats?.completedOrders || 0,
          analytics?.orderStats?.cancelledOrders || 0,
        ],
        backgroundColor: [
          "rgba(251, 146, 60, 0.8)",
          "rgba(99, 102, 241, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {session?.user?.firstName}!
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Here's what's happening at DinarExchange today.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                      <dd className="text-sm text-gray-500">
                        {stat.change}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Trends Chart */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Daily Trends
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Orders and revenue over time
              </p>
            </div>
            <div className="px-4 pb-5">
              <div className="h-64">
                <Line data={dailyTrendsData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Currency Distribution */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Currency Distribution
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Volume by currency
              </p>
            </div>
            <div className="px-4 pb-5">
              <div className="h-64">
                <Bar data={currencyData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Order Status
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Current order distribution
              </p>
            </div>
            <div className="px-4 pb-5">
              <div className="h-64">
                <Doughnut data={orderStatusData} options={{ ...chartOptions, maintainAspectRatio: true }} />
              </div>
            </div>
          </div>

          {/* Recent High-Risk Activities */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Alerts
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                High-risk activities requiring attention
              </p>
            </div>
            <div className="px-4 pb-5">
              <div className="space-y-3">
                {analytics?.highRiskActivities?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.action.replace(/_/g, " ").toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.adminId?.firstName} {activity.adminId?.lastName}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Risk: {activity.riskScore}
                      </span>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No high-risk activities detected
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quick Actions
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Common administrative tasks
            </p>
          </div>
          <div className="px-4 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                New Order
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <UsersIcon className="h-4 w-4 mr-2" />
                View Customers
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Full Analytics
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <BellIcon className="h-4 w-4 mr-2" />
                Notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}