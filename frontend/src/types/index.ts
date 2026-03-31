export interface User {
  id: string;
  email: string;
  name: string;
  role: 'VENDOR' | 'CUSTOMER';
  avatar?: string;
  bio?: string;
  category?: string;
  pricing?: string;
  createdAt: string;
}

export interface Vendor extends User {
  completedBookings: number;
  availability?: AvailabilityEntry[];
}

export interface AvailabilityEntry {
  date: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
}

export interface Booking {
  id: string;
  vendorId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  message?: string;
  status: 'INQUIRY' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONTRACT_SENT' | 'CONTRACT_SIGNED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  amount?: number;
  createdAt: string;
  updatedAt: string;
  activityLogs?: ActivityLog[];
  vendor?: Vendor;
}

export interface ActivityLog {
  id: string;
  bookingId: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  conversionRate: number;
  monthlyRevenue: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentBookings: Booking[];
  upcomingEvents: Booking[];
}

export interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}
