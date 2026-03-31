'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { Menu, X, LogOut, LayoutDashboard, ClipboardList } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            EventBook
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/vendor/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/vendor/bookings" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Bookings
                </Link>
                <div className="flex items-center space-x-3 ml-4">
                  <span className="text-sm text-gray-600">{user?.name}</span>
                  <button
                    onClick={logout}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/search" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Find Vendors
                </Link>
                <Link href="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <Link href="/vendor/dashboard" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  <LayoutDashboard className="h-5 w-5 mr-2" />
                  Dashboard
                </Link>
                <Link href="/vendor/bookings" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  <ClipboardList className="h-5 w-5 mr-2" />
                  Bookings
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100 rounded-md"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/search" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  Search
                </Link>
                <Link href="/login" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  Login
                </Link>
                <Link href="/register" className="flex items-center px-3 py-2 text-indigo-600 font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
