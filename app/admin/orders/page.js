"use client";

import { useEffect, useState } from "react";
import { ShoppingBagIcon, ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import AdminLayout from "../../../components/admin/AdminLayout";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(amount || 0);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [summary, setSummary] = useState({ totalAmount: 0, averageAmount: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setPagination(data.pagination);
        setSummary(data.summary);
      } else {
        setOrders([]);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 });
        setSummary({ totalAmount: 0, averageAmount: 0, count: 0 });
      }
    } catch (err) {
      setOrders([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 });
      setSummary({ totalAmount: 0, averageAmount: 0, count: 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handlePageChange = (newPage) => {
    fetchOrders(newPage);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Title and Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          </div>
          {/* Quick Summary */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-blue-50 px-4 py-2 rounded text-sm font-medium text-blue-800">
              Total: {pagination.totalItems}
            </div>
            <div className="bg-green-50 px-4 py-2 rounded text-sm font-medium text-green-800">
              Revenue: {formatCurrency(summary.totalAmount)}
            </div>
            <div className="bg-purple-50 px-4 py-2 rounded text-sm font-medium text-purple-800">
              Avg: {formatCurrency(summary.averageAmount)}
            </div>
          </div>
        </div>
        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No orders found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono">{order.orderId || order._id}</td>
                    <td className="px-4 py-3">
                      {order.customer?.personalInfo
                        ? `${order.customer.personalInfo.firstName} ${order.customer.personalInfo.lastName}`
                        : "Unknown"}
                    </td>
                    <td className="px-4 py-3">{order.orderType || "N/A"}</td>
                    <td className="px-4 py-3">
                      {order.amount?.fromAmount?.toLocaleString?.() || "-"} {order.amount?.from || ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${
                          order.orderStatus === "completed"
                            ? "bg-green-100 text-green-700"
                            : order.orderStatus === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.orderStatus === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : order.orderStatus === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }
                      `}>
                        {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1) || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-end mt-6 items-center gap-2">
            <button
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50`}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50`}
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
