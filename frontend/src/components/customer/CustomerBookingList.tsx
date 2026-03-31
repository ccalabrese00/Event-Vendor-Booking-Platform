'use client';

import { useState } from 'react';
import { customerApi } from '@/lib/api/customer';
import { Booking } from '@/types';
import { formatDate, getStatusColor } from '@/lib/utils/formatters';
import { Search, Calendar, Mail } from 'lucide-react';

export function CustomerBookingList() {
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const data = await customerApi.getBookings(email);
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Look Up Your Bookings</h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Find Bookings'}
          </button>
        </form>
      </div>

      {searched && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bookings found for this email address.</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {booking.vendor?.name || 'Unknown Vendor'}
                    </h3>
                    <p className="text-sm text-gray-500">{booking.vendor?.category}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 md:mt-0 w-fit ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Event Date:</span>
                    <p className="font-medium">{formatDate(booking.date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment:</span>
                    <p className="font-medium">{booking.paymentStatus}</p>
                  </div>
                  {booking.amount && (
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <p className="font-medium">${booking.amount}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Booking ID:</span>
                    <p className="font-medium text-xs">{booking.id}</p>
                  </div>
                </div>

                {booking.message && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-gray-500 text-sm">Your Message:</span>
                    <p className="text-sm text-gray-700 mt-1">{booking.message}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
