'use client';

import { Booking } from '@/types';
import { formatDate, getStatusColor } from '@/lib/utils/formatters';
import Link from 'next/link';

interface RecentBookingsProps {
  bookings: Booking[];
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {bookings.length === 0 ? (
          <p className="px-6 py-4 text-gray-500">No bookings yet</p>
        ) : (
          bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/vendor/bookings/${booking.id}`}
              className="block px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{booking.customerName}</p>
                  <p className="text-sm text-gray-500">{booking.customerEmail}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(booking.date)}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      <div className="px-6 py-3 border-t border-gray-200">
        <Link href="/vendor/bookings" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          View all bookings →
        </Link>
      </div>
    </div>
  );
}
