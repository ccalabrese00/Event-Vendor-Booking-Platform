'use client';

import { Booking } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { Calendar } from 'lucide-react';

interface UpcomingEventsProps {
  events: Booking[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Events (Next 30 Days)</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {events.length === 0 ? (
          <p className="px-6 py-4 text-gray-500">No upcoming events</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="px-6 py-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.customerName}</p>
                  <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                  {event.amount && (
                    <p className="text-sm font-medium text-green-600 mt-1">
                      {formatCurrency(event.amount)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
