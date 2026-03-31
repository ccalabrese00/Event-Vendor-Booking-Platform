import { CustomerBookingList } from '@/components/customer/CustomerBookingList';

export default function MyBookingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-600 mt-2">View all your booking requests</p>
      </div>

      <CustomerBookingList />
    </div>
  );
}
