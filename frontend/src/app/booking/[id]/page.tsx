'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { vendorApi } from '@/lib/api/vendor';
import { Vendor } from '@/types';
import { BookingForm } from '@/components/customer/BookingForm';
import { Calendar, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BookingPage() {
  const params = useParams();
  const vendorId = params.id as string;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const data = await vendorApi.getProfile(vendorId);
        setVendor(data);
      } catch {
        setError('Failed to load vendor profile');
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-red-600">{error || 'Vendor not found'}</p>
        <Link href="/search" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/search"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Search
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Vendor Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{vendor.name}</h1>
              <div className="flex items-center mt-2">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-indigo-100">{vendor.category || 'Event Vendor'}</span>
              </div>
            </div>
            {vendor.completedBookings > 0 && (
              <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                <Star className="h-4 w-4 mr-1 fill-current" />
                <span className="text-sm">{vendor.completedBookings} completed bookings</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Vendor Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 mb-4">{vendor.bio || 'No bio available'}</p>
              
              {vendor.pricing && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900">Pricing</h3>
                  <p className="text-gray-600">{vendor.pricing}</p>
                </div>
              )}

              {vendor.availability && vendor.availability.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Upcoming Availability</h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.availability
                      .filter(a => a.status === 'AVAILABLE')
                      .slice(0, 10)
                      .map((avail) => (
                        <span
                          key={avail.date}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                        >
                          {new Date(avail.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Booking Form */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Booking</h2>
              <BookingForm vendor={vendor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
