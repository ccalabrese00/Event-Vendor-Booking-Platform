import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/stats - Get vendor dashboard stats
router.get('/stats', authenticate, requireRole(['VENDOR']), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Get counts
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
    ] = await Promise.all([
      prisma.booking.count({ where: { vendorId: userId } }),
      prisma.booking.count({ where: { vendorId: userId, status: 'PENDING' } }),
      prisma.booking.count({ where: { vendorId: userId, status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { vendorId: userId, status: 'COMPLETED' } }),
      prisma.booking.count({ where: { vendorId: userId, status: 'CANCELLED' } }),
    ]);

    // Calculate conversion rate
    const conversionRate = totalBookings > 0
      ? ((confirmedBookings + completedBookings) / totalBookings) * 100
      : 0;

    // Get this month's revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await prisma.booking.aggregate({
      where: {
        vendorId: userId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        paymentStatus: 'PAID_IN_FULL',
        updatedAt: { gte: startOfMonth },
      },
      _sum: { price: true },
    });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { vendorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        customerName: true,
        date: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    // Get upcoming events
    const upcomingEvents = await prisma.booking.findMany({
      where: {
        vendorId: userId,
        date: { gte: new Date() },
        status: { in: ['CONFIRMED', 'ACCEPTED'] },
      },
      orderBy: { date: 'asc' },
      take: 5,
      select: {
        id: true,
        customerName: true,
        date: true,
        status: true,
      },
    });

    res.json({
      stats: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        conversionRate: Math.round(conversionRate * 100) / 100,
        monthlyRevenue: monthlyRevenue._sum?.price?.toNumber() || 0,
      },
      recentBookings,
      upcomingEvents,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/revenue - Get revenue data for chart
router.get('/revenue', authenticate, requireRole(['VENDOR']), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const months = parseInt(req.query.months as string) || 6;

    // Calculate start date
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Get bookings by month
    const bookings = await prisma.booking.findMany({
      where: {
        vendorId: userId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        paymentStatus: 'PAID_IN_FULL',
        updatedAt: { gte: startDate },
      },
      select: {
        price: true,
        updatedAt: true,
      },
    });

    // Group by month
    const revenueByMonth = new Map<string, { revenue: number; bookings: number }>();

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      revenueByMonth.set(monthKey, { revenue: 0, bookings: 0 });
    }

    bookings.forEach((booking: { updatedAt: Date; price: { toNumber: () => number } | null }) => {
      const monthKey = booking.updatedAt.toLocaleString('default', { month: 'short' });
      const current = revenueByMonth.get(monthKey) || { revenue: 0, bookings: 0 };
      revenueByMonth.set(monthKey, {
        revenue: current.revenue + (booking.price?.toNumber() || 0),
        bookings: current.bookings + 1,
      });
    });

    // Convert to array and reverse order
    const revenue = Array.from(revenueByMonth.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        bookings: data.bookings,
      }))
      .reverse();

    res.json({ revenue });
  } catch (error) {
    console.error('Revenue data error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

export default router;
