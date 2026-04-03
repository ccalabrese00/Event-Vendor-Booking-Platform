'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const isVendor = session.user?.role === 'VENDOR';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome, {session.user?.name}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isVendor ? 'Bookings' : 'My Bookings'}
          </h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">0</p>
          <p className="text-sm text-gray-500 mt-1">Total bookings</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isVendor ? 'Pending Requests' : 'Pending Bookings'}
          </h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
          <p className="text-sm text-gray-500 mt-1">Awaiting response</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isVendor ? 'Availability' : 'Saved Vendors'}
          </h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {isVendor ? '0%' : '0'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {isVendor ? 'This month' : 'Favorites'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {isVendor ? (
            <>
              <Link
                href="/vendor/calendar"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Manage Calendar
              </Link>
              <Link
                href="/vendor/bookings"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                View Bookings
              </Link>
              <Link
                href="/profile"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Edit Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/search"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Find Vendors
              </Link>
              <Link
                href="/my-bookings"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                My Bookings
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
