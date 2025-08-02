// File: app/admin/customers/page.js

"use client";

import { useEffect, useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import AdminLayout from "../../../components/admin/AdminLayout";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulate API call (replace with your real fetch)
  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      try {
        // Replace this with your API call:
        const response = await fetch("/api/admin/customers");
        if (response.ok) {
          const data = await response.json();
          setCustomers(data.customers);
        } else {
          setCustomers([]);
        }
      } catch (error) {
        setCustomers([]);
      }
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <UserIcon className="h-8 w-8 text-indigo-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Registered</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{customer.firstName} {customer.lastName}</td>
                    <td className="px-4 py-3">{customer.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${customer.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {customer.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(customer.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
