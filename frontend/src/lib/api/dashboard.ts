import { apiClient } from './client';
import { DashboardData, RevenueData } from '@/types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardData> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  getRevenue: async (months: number = 6): Promise<RevenueData[]> => {
    const response = await apiClient.get(`/dashboard/revenue?months=${months}`);
    return response.data.revenue;
  },
};
