"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  HomeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ChartBarIcon,
  BellIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  ShieldExclamationIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import {
  BellIcon as BellSolidIcon,
  ShoppingBagIcon as ShoppingBagSolidIcon,
  UsersIcon as UsersSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  HomeIcon as HomeSolidIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: HomeIcon, iconSolid: HomeSolidIcon },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBagIcon, iconSolid: ShoppingBagSolidIcon },
  { name: "Customers", href: "/admin/customers", icon: UsersIcon, iconSolid: UsersSolidIcon },
  { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon, iconSolid: ChartBarSolidIcon },
  { name: "Notifications", href: "/admin/notifications", icon: BellIcon, iconSolid: BellSolidIcon },
  { name: "Audit Trail", href: "/admin/audit", icon: ClipboardDocumentListIcon },
];

const adminOnlyNavigation = [
  { name: "Admin Management", href: "/admin/admins", icon: ShieldExclamationIcon },
  { name: "System Settings", href: "/admin/settings", icon: CogIcon },
];

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Fetch notifications count
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/admin/notifications?unreadOnly=true&limit=5");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (session) {
      fetchNotifications();
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Signed out successfully");
      router.replace("/admin/login");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter(item => {
    switch (item.href) {
      case "/admin/orders":
        return session.user.permissions?.canViewOrders;
      case "/admin/customers":
        return session.user.permissions?.canViewCustomers;
      case "/admin/analytics":
        return session.user.permissions?.canViewAnalytics;
      case "/admin/audit":
        return session.user.permissions?.canViewAuditLog;
      default:
        return true;
    }
  });

  const showAdminNav = session.user.role === "admin" && session.user.permissions?.canManageAdmins;

  const Sidebar = ({ mobile = false }) => (
    <div className={`${mobile ? "md:hidden" : "hidden md:flex"} ${mobile ? "fixed inset-0 z-40" : "relative"} md:w-64 md:flex-col`}>
      {mobile && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
      )}
      
      <div className={`${mobile ? "relative" : ""} flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto`}>
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DE</span>
            </div>
            <h1 className="ml-3 text-xl font-semibold text-gray-900">Admin Panel</h1>
          </div>
          {mobile && (
            <button
              className="ml-auto h-6 w-6 text-gray-400"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon />
            </button>
          )}
        </div>

        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = isActive ? item.iconSolid || item.icon : item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } group flex items-center px-2 py-2 text-sm font-medium border-l-4 transition-colors duration-200`}
                >
                  <Icon className={`${isActive ? "text-indigo-500" : "text-gray-400 group-hover:text-gray-500"} mr-3 h-6 w-6`} />
                  {item.name}
                  {item.name === "Notifications" && unreadCount > 0 && (
                    <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {showAdminNav && (
              <>
                <div className="border-t border-gray-200 mt-6 pt-6">
                  <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administration
                  </p>
                </div>
                {adminOnlyNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                          : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } group flex items-center px-2 py-2 text-sm font-medium border-l-4 transition-colors duration-200`}
                    >
                      <item.icon className={`${isActive ? "text-indigo-500" : "text-gray-400 group-hover:text-gray-500"} mr-3 h-6 w-6`} />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>

        {/* User info */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{session.user.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{session.user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      {sidebarOpen && <Sidebar mobile />}

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
                {navigation.find(item => item.href === pathname)?.name || "Admin Panel"}
              </h2>
            </div>

            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications dropdown */}
              <div className="relative">
                <Link
                  href="/admin/notifications"
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    </span>
                  )}
                </Link>
              </div>

              {/* User dropdown */}
              <button
                onClick={handleSignOut}
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}