import { apiClient } from './client';
import { Booking } from '@/types';

export const customerApi = {
  getBookings: async (email: string): Promise<Booking[]> => {
    const response = await apiClient.get(`/customer?email=${encodeURIComponent(email)}`);
    return response.data.bookings;
  },

  getBooking: async (id: string, email: string): Promise<Booking> => {
    const response = await apiClient.get(`/customer/${id}?email=${encodeURIComponent(email)}`);
    return response.data.booking;
  },
};
