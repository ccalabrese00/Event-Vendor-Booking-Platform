'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, User, Search, LogOut, Menu } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                EventVendor
              </Link>
              
              {session?.user && (
                <div className="hidden md:flex ml-10 space-x-8">
                  <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link href="/profile" className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link href="/search" className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {session?.user ? (
                <>
                  <span className="text-gray-700">{session.user.name}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-500 hover:text-gray-900 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="space-x-4">
                  <Link href="/login" className="text-gray-500 hover:text-gray-900">
                    Sign in
                  </Link>
                  <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
