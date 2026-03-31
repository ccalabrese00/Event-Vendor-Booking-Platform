'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingsApi } from '@/lib/api/bookings';
import { Booking } from '@/types';
import { formatDate, formatCurrency, getStatusColor, getPaymentStatusColor } from '@/lib/utils/formatters';
import { PaymentUpdateModal } from '@/components/bookings/PaymentUpdateModal';
import { useAuthStore } from '@/lib/store/authStore';
import { ArrowLeft, Calendar, Mail, Phone, CreditCard, User, Clock } from 'lucide-react';
import Link from 'next/link';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchBooking = async () => {
      try {
        const data = await bookingsApi.getById(bookingId);
        setBooking(data);
      } catch (err) {
        console.error('Failed to fetch booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [isAuthenticated, router, bookingId]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const updated = await bookingsApi.updateStatus(bookingId, newStatus);
      setBooking(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Booking not found</p>
        <Link href="/vendor/bookings" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
          Back to Bookings
        </Link>
      </div>
    );
  }

  const statusOptions = ['INQUIRY', 'PENDING', 'ACCEPTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/vendor/bookings"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Bookings
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-sm text-gray-500 mt-1">ID: {booking.id}</p>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Customer
              </h3>
              <p className="font-medium text-gray-900">{booking.customerName}</p>
              <p className="text-gray-600">
                <Mail className="inline h-4 w-4 mr-1" />
                {booking.customerEmail}
              </p>
              {booking.customerPhone && (
                <p className="text-gray-600">
                  <Phone className="inline h-4 w-4 mr-1" />
                  {booking.customerPhone}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Event Date
              </h3>
              <p className="font-medium text-gray-900">{formatDate(booking.date)}</p>
              <p className="text-gray-600">
                <Clock className="inline h-4 w-4 mr-1" />
                Requested {formatDate(booking.createdAt)}
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                <CreditCard className="inline h-4 w-4 mr-1" />
                Payment Status
              </h3>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                  {booking.paymentStatus}
                </span>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Update Payment
                </button>
              </div>
            </div>
            {booking.amount && (
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(booking.amount)}
              </p>
            )}
          </div>

          {/* Message */}
          {booking.message && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Message</h3>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{booking.message}</p>
            </div>
          )}

          {/* Status Update */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updatingStatus || booking.status === status}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    booking.status === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {updatingStatus && booking.status !== status ? '...' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          {booking.activityLogs && booking.activityLogs.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Activity Log</h3>
              <div className="space-y-2">
                {booking.activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-medium text-gray-900">{log.action}</p>
                      <p className="text-gray-600">{log.details}</p>
                      <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <PaymentUpdateModal
          bookingId={bookingId}
          currentStatus={booking.paymentStatus}
          currentAmount={booking.amount}
          onClose={() => setShowPaymentModal(false)}
          onUpdate={async () => {
            const updated = await bookingsApi.getById(bookingId);
            setBooking(updated);
          }}
        />
      )}
    </div>
  );
}
