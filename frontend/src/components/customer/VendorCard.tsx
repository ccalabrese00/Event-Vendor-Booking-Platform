'use client';

import { Vendor } from '@/types';
import { Calendar, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface VendorCardProps {
  vendor: Vendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
            <span className="inline-block mt-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded">
              {vendor.category || 'Vendor'}
            </span>
          </div>
          {vendor.completedBookings > 0 && (
            <div className="flex items-center text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="ml-1 text-sm text-gray-600">
                {vendor.completedBookings} bookings
              </span>
            </div>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {vendor.bio || 'No description available'}
        </p>

        {vendor.pricing && (
          <p className="text-sm text-gray-500 mb-4">
            <span className="font-medium">Pricing:</span> {vendor.pricing}
          </p>
        )}

        <Link
          href={`/booking/${vendor.id}`}
          className="flex items-center justify-center w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Book Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </div>
    </div>
  );
}
