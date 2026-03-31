import { apiClient } from './client';
import { Booking } from '@/types';

export const bookingsApi = {
  getAll: async (filters?: { status?: string; startDate?: string; endDate?: string }): Promise<Booking[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/bookings?${params.toString()}`);
    return response.data.bookings;
  },

  getById: async (id: string): Promise<Booking> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data.booking;
  },

  create: async (data: {
    vendorId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    date: string;
    message?: string;
  }): Promise<Booking> => {
    const response = await apiClient.post('/bookings', data);
    return response.data.booking;
  },

  updateStatus: async (id: string, status: string): Promise<Booking> => {
    const response = await apiClient.put(`/bookings/${id}`, { status });
    return response.data.booking;
  },

  updatePayment: async (id: string, paymentStatus: string, amount?: number): Promise<Booking> => {
    const response = await apiClient.put(`/bookings/${id}/payment`, { paymentStatus, amount });
    return response.data.booking;
  },
};
