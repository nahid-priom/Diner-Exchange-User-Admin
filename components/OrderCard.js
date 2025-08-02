"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DocumentTextIcon, PhotoIcon, TruckIcon } from "@heroicons/react/24/outline";
import { FiTrash2, FiCheck } from "react-icons/fi";

const statusMap = {
  pending:    { label: "Pending",    bg: "bg-amber-50",    text: "text-amber-800",    border: "border-amber-200" },
  processing: { label: "Processing", bg: "bg-blue-50",     text: "text-blue-800",     border: "border-blue-200" },
  completed:  { label: "Completed",  bg: "bg-emerald-50",  text: "text-emerald-800",  border: "border-emerald-200" },
  cancelled:  { label: "Cancelled",  bg: "bg-red-50",      text: "text-red-800",      border: "border-red-200" },
  shipped:    { label: "Shipped",    bg: "bg-indigo-50",   text: "text-indigo-800",   border: "border-indigo-200" },
};

export default function OrderCard({ order, onUploadClick, onDeleteRequest }) {
  const [deleteRequested, setDeleteRequested] = useState(false);

  const statusKey = (order.status || "pending").toLowerCase();
  const status = statusMap[statusKey] || statusMap["pending"];

  // IDs, dates, values
  const orderId = order._id ? String(order._id) : order.id || "—";
  const orderDate = order.createdAt ? new Date(order.createdAt) : order.date ? new Date(order.date) : null;

  // Amount: eg, "2 50,000 IQD"
  const amountStr =
    order.currency && order.quantity
      ? `${order.quantity} ${order.currency}`
      : order.currency || "—";

  // Has uploads?
  const hasId = Boolean(order.idFileUrl);
  const hasReceipt = Boolean(order.paymentReceiptUrl);

  // Delete handler
  const handleDelete = async () => {
    setDeleteRequested(true);
    await onDeleteRequest(orderId);
  };

  return (
    <motion.div
      className={`bg-white p-5 rounded-xl shadow-sm border ${status.border} transition-all duration-200`}
    >
      {/* Top row: Order ID, Date, Status, Delete */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 break-all">Order #{orderId}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {orderDate
              ? orderDate.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deleteRequested ? (
            <span className="flex items-center text-xs bg-red-50 text-green-700 px-2 py-1 rounded-md">
              <FiCheck className="h-3 w-3 mr-1" /> Requested
            </span>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              type="button"
              className="flex items-center text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded-md transition-colors"
              title="Request Deletion"
            >
              <FiTrash2 className="h-3 w-3 mr-1" />
              <span className="sr-only md:not-sr-only">Delete</span>
            </motion.button>
          )}
          <span className={`text-xs px-3 py-1 rounded-full ${status.bg} ${status.text} font-medium capitalize`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Main details */}
      <div className="mb-2">
        <div className="text-lg font-bold text-gray-900">{amountStr}</div>
        <div className="text-xs text-gray-600">
          {order.fullName && <span>{order.fullName}</span>}
          {order.email && <span> &bull; {order.email}</span>}
        </div>
      </div>

      {/* Tracking */}
      {order.trackingNumber && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <span className="p-2 bg-white rounded-lg mr-3 shadow-xs">
              <TruckIcon className="h-5 w-5 text-gray-600" />
            </span>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Tracking Number</p>
              <a
                href={`https://www.dhl.com/track?trackingNumber=${order.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline flex items-center"
              >
                {order.trackingNumber}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload buttons */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 mt-3">
        {/* ID Upload */}
        {!hasId && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onUploadClick(order, "id")}
            className="flex items-center text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors"
            type="button"
          >
            <span className="p-1 bg-blue-100 rounded mr-2">
              <PhotoIcon className="h-4 w-4 text-blue-600" />
            </span>
            Upload ID
          </motion.button>
        )}

        {/* Payment Receipt Upload */}
        {!hasReceipt && statusKey !== "shipped" && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onUploadClick(order, "receipt")}
            className="flex items-center text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg transition-colors"
            type="button"
          >
            <span className="p-1 bg-emerald-100 rounded mr-2">
              <DocumentTextIcon className="h-4 w-4 text-emerald-600" />
            </span>
            Upload Receipt
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
