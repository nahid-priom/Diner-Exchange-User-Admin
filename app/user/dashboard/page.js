'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {  FiFilter, FiSearch } from 'react-icons/fi';
import MainLayout from '../../MainLayout'; // adjust path if needed
import OrderCard from '../../../components/OrderCard';
import UploadModal from '../../../components/UploadModal';

const ORDER_STATUSES = ['pending', 'approved', 'rejected', 'completed'];

export default function OrderDashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);

  const router = useRouter();

  // Auth check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/user/api/verify-magic-link', { method: 'GET' });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push('/user/login');
        }
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/user/login');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) return;
      setIsFetchingOrders(true);
      try {
        const res = await fetch(`/user/api/orders?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const { orders } = await res.json();
          setOrders(orders || []);
        } else {
          setOrders([]);
          toast.error('Failed to fetch orders');
        }
      } catch (e) {
        console.error('Fetch orders error:', e);
        toast.error('Could not load orders');
        setOrders([]);
      } finally {
        setIsFetchingOrders(false);
      }
    };
    if (user?.email) fetchOrders();
  }, [user]);

  // Logout handler
  const handleLogout = async () => {
    try {
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      toast.success('Logged out successfully');
      router.push('/user/login');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    } 
  };

  // Filtered orders
  const filteredOrders = (activeTab === 'all' ? orders : orders.filter(order => order.status === activeTab))
    .filter(order =>
      order._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.quantity?.toString().includes(searchQuery) ||
      order.currency?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Handlers
  const handleUploadClick = (order, type) => {
    setCurrentOrder(order);
    setUploadType(type);
    setShowUploadModal(true);
  };

  // You would implement your own delete request logic here, e.g.:
  const handleDeleteRequest = (orderId) => {
    toast('To request deletion, please contact admin.', { icon: '🛑' });
  };

  // On upload modal close, refresh orders if needed
  const handleUploadModalClose = (didUpload) => {
    setShowUploadModal(false);
    setCurrentOrder(null);
    setUploadType(null);
    if (didUpload) {
      // Refetch orders to get updated file links
      if (user?.email) {
        fetch(`/user/api/orders?email=${encodeURIComponent(user.email)}`)
          .then(res => res.ok ? res.json() : Promise.reject())
          .then(({ orders }) => setOrders(orders || []))
          .catch(() => toast.error('Could not refresh orders'));
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin mx-auto h-8 w-8 text-indigo-600 mb-4">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Dashboard Header */}
          <div className="bg-white shadow-xl rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {user.email}
              </h1>
              <p className="text-gray-600">Manage and track your currency exchange orders below.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
              {/* Optionally implement a new exchange button/modal */}
              {/* <button className="flex items-center gap-2 px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors">
                <FiPlus className="w-4 h-4" />
                <span>New Exchange</span>
              </button> */}
            </div>
          </div>

          {/* Filter & Search */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Order ID, quantity, or currency..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-500" />
                <select
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange"
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                >
                  <option value="all">All Orders</option>
                  {ORDER_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {['all', ...ORDER_STATUSES].map((status) => (
              <motion.div
                key={status}
                whileHover={{ y: -2 }}
                className={`p-4 rounded-xl shadow-sm cursor-pointer transition-colors ${
                  activeTab === status ? 'ring-2 ring-orange bg-orange-50' : 'bg-white'
                }`}
                onClick={() => setActiveTab(status)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  <span className="text-xl font-bold">
                    {status === 'all'
                      ? orders.length
                      : orders.filter(o => o.status === status).length
                    }
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Orders List */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-h-[150px]">
            {isFetchingOrders ? (
              <div className="py-8 text-center text-gray-400">Loading your orders...</div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredOrders.map(order => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <OrderCard
                        order={order}
                        onUploadClick={handleUploadClick}
                        onDeleteRequest={handleDeleteRequest}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders match your criteria</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-orange mt-2 hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Upload Modal */}
          <AnimatePresence>
            {showUploadModal && (
              <UploadModal
                order={currentOrder}
                type={uploadType}
                onClose={handleUploadModalClose}
                uploadEndpoint="/user/api/upload"
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
