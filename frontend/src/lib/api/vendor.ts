import { apiClient } from './client';
import { Vendor } from '@/types';

export const vendorApi = {
  search: async (filters?: { category?: string; available?: boolean; search?: string }): Promise<Vendor[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.available) params.append('available', 'true');
    if (filters?.search) params.append('search', filters.search);
    
    const response = await apiClient.get(`/vendor/search?${params.toString()}`);
    return response.data.vendors;
  },

  getProfile: async (id: string): Promise<Vendor> => {
    const response = await apiClient.get(`/vendor/${id}/profile`);
    return response.data.vendor;
  },

  getMyProfile: async (): Promise<Vendor> => {
    const response = await apiClient.get('/vendor/profile');
    return response.data.profile;
  },

  updateProfile: async (data: Partial<Vendor>): Promise<Vendor> => {
    const response = await apiClient.put('/vendor/profile', data);
    return response.data.profile;
  },
};
