'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardApi } from '@/lib/api/dashboard';
import { DashboardData, RevenueData } from '@/types';
import { StatCards } from '@/components/dashboard/StatCards';
import { RecentBookings } from '@/components/dashboard/RecentBookings';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { useAuthStore } from '@/lib/store/authStore';

export default function VendorDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [dashboardData, revenueData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRevenue(6),
        ]);
        setData(dashboardData);
        setRevenue(revenueData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, router]);

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your bookings and revenue</p>
      </div>

      <StatCards stats={data.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <RevenueChart data={revenue} />
        <UpcomingEvents events={data.upcomingEvents} />
      </div>

      <div className="mt-8">
        <RecentBookings bookings={data.recentBookings} />
      </div>
    </div>
  );
}
