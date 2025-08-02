"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  EnvelopeIcon,
  HomeIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  ShoppingCartIcon,
  PhoneArrowUpRightIcon,
  Bars3Icon,
  XMarkIcon,
  EnvelopeOpenIcon,
} from "@heroicons/react/24/outline";
import logo from "../app/assets/logo.png";

// Contact/Navigation Data
const CONTACT_INFO = [
  {
    text: "dinars@dinarexchange.co.nz",
    icon: <EnvelopeOpenIcon className="w-4 h-4" />,
    showOnMobile: true,
  },
  {
    text: "+64 9 872 4693",
    icon: <PhoneArrowUpRightIcon className="w-4 h-4" />,
    showOnMobile: false,
  },
  {
    text: "+61 417 460 236",
    icon: <PhoneArrowUpRightIcon className="w-4 h-4" />,
    showOnMobile: true,
  },
];

const NAV_LINKS = [
  { name: "Home", href: "/", icon: <HomeIcon className="w-5 h-5" /> },
  { name: "Buy Iraqi Dinar", href: "/buydinar", icon: <CurrencyDollarIcon className="w-5 h-5" /> },
  { name: "Buy Zimbabwe Dollar", href: "/buyzimdoller", icon: <CurrencyDollarIcon className="w-5 h-5" /> },
  { name: "About Us", href: "/about", icon: <UserCircleIcon className="w-5 h-5" /> },
  { name: "Contact Us", href: "/contact", icon: <PhoneIcon className="w-5 h-5" /> },
];

// NavLink
function NavLink({ href, name, icon }) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-1 font-bold text-gray-900 hover:text-orange-500 transition-colors px-2 py-1 rounded hover:bg-gray-50"
    >
      <span className="hidden lg:inline-block">{icon}</span>
      <span className="text-sm font-medium">{name}</span>
    </Link>
  );
}

// Profile Dropdown
const ProfileDropdown = forwardRef(
  ({ isOpen, onToggle, user, menuItems, onLogin, onLogout }, ref) => (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded p-1"
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        <UserCircleIcon className="w-9 h-9 text-orange-500 bg-orange-50 rounded-full border-2 border-orange-500 shadow" />
        <span className="text-sm font-medium text-gray-700">
          Profile
        </span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
          <div className="py-1">
            {!user ? (
              <div className="flex flex-col px-4 py-2">
                <button
                  onClick={onLogin}
                  className="py-2 px-3 rounded bg-orange-500 text-white hover:bg-orange-600 transition"
                >
                  Log In
                </button>
              </div>
            ) : (
              <>
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-500 transition-colors"
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={onLogout}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 font-bold transition-colors"
                >
                  <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
);
ProfileDropdown.displayName = "ProfileDropdown";

// Mobile Menu Button
function MobileMenuButton({ isOpen, onClick }) {
  return (
    <button
      className="lg:hidden p-2 text-gray-700 hover:text-orange-500 focus:outline-none flex items-center gap-2"
      onClick={onClick}
      aria-label="Toggle menu"
    >
      {isOpen ? (
        <>
          <XMarkIcon className="h-6 w-6 text-sm text-shadow-gray-800 font-bold" />
          <span className="text-sm text-shadow-gray-800 font-bold">CLOSE</span>
        </>
      ) : (
        <>
          <Bars3Icon className="h-6 w-6 text-sm text-shadow-gray-800 font-bold" />
          <span className="text-sm text-shadow-gray-800 font-bold">MENU</span>
        </>
      )}
    </button>
  );
}

// Mobile Menu
function MobileMenu({ isOpen, navLinks, user, profileMenuItems, onClose, onLogin, onLogout }) {
  return !isOpen ? null : (
    <div className="lg:hidden bg-white border-t border-gray-200 z-40">
      <nav className="px-2 py-3 space-y-1">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="flex items-center px-3 py-2 text-base font-bold text-gray-900 hover:text-orange-500 hover:bg-gray-50 rounded-md"
            onClick={onClose}
          >
            <span className="mr-3">{link.icon}</span>
            {link.name}
          </Link>
        ))}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center px-3 py-2">
            <UserCircleIcon className="w-9 h-9 text-orange-500 bg-orange-50 rounded-full border-2 border-orange-500 shadow mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-700">Profile</p>
            </div>
          </div>
          {!user ? (
            <div className="flex flex-col px-3 py-2">
              <button
                onClick={() => {
                  onLogin();
                  onClose();
                }}
                className="py-2 px-3 rounded bg-orange-500 text-white hover:bg-orange-600 transition"
              >
                Log In
              </button>
            </div>
          ) : (
            <>
              {profileMenuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="flex w-full items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50 rounded-md"
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex w-full items-center px-3 py-2 text-base font-bold text-red-600 hover:bg-gray-50 rounded-md"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

// Main Header
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const profileRef = useRef(null);

  // Check login with magic link
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/user/api/verify-magic-link", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const profileMenuItems = [
    {
      icon: <HomeIcon className="w-5 h-5" />,
      label: "Orders",
      action: () => router.push("/user/dashboard"),
    },
    {
      icon: <EnvelopeIcon className="w-5 h-5" />,
      label: "Messages",
      action: () => router.push("/user/messages"),
    },
  ];

  const handleLogin = () => router.push("/user/login");
  const handleLogout = () => {
    setUser(null);
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsProfileOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-orange-700 text-white text-sm">
        <div className="container max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              {CONTACT_INFO.map((info, idx) => (
                <div
                  key={idx}
                  className={`flex items-center lg:ml-0 py-3 ml-6 justify-between space-x-1 ${
                    !info.showOnMobile ? "hidden sm:flex" : ""
                  }`}
                >
                  {info.icon}
                  {info.text.includes("@") ? (
                    <a href={`mailto:${info.text}`} className="text-xs sm:text-sm hover:underline">
                      {info.text}
                    </a>
                  ) : (
                    <a href={`tel:${info.text.replace(/\s/g, "")}`} className="text-xs sm:text-sm hover:underline">
                      {info.text}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button className="hidden lg:flex items-center gap-2 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-md hover:opacity-90 transition-opacity shadow-md hover:shadow-orange-700/30">
            <ShoppingCartIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Order Now</span>
          </button>
        </div>
      </div>
      {/* Main Navigation */}
      <div className={`bg-white shadow-sm transition-all duration-300 ${isScrolled ? "shadow-md" : ""}`}>
        <div className="container w-full max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500" aria-label="Go to homepage">
            <Image src={logo} alt="Company Logo" width={200} height={60} priority />
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-gray-800">NZ</span>
              <Image
                src="https://static.vecteezy.com/system/resources/thumbnails/012/024/958/small_2x/new-zealand-flag-with-grunge-texture-png.png"
                alt="New Zealand Flag"
                width={20}
                height={14}
                className="rounded-sm"
              />
            </div>
          </Link>
          <nav className="hidden lg:flex items-center space-x-6">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.name} {...link} />
            ))}
          </nav>
          <MobileMenuButton
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
          <div className="hidden lg:block">
            <ProfileDropdown
              ref={profileRef}
              isOpen={isProfileOpen}
              onToggle={() => setIsProfileOpen(!isProfileOpen)}
              user={user}
              menuItems={profileMenuItems}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
          </div>
        </div>
        <MobileMenu
          isOpen={isMobileMenuOpen}
          navLinks={NAV_LINKS}
          user={user}
          profileMenuItems={profileMenuItems}
          onClose={() => setIsMobileMenuOpen(false)}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      </div>
    </header>
  );
}
