import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/activity/recent - Get recent activity for vendor dashboard
router.get('/recent', authenticate, requireRole(['VENDOR']), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get all booking IDs for this vendor
    const vendorBookings = await prisma.booking.findMany({
      where: { vendorId: userId },
      select: { id: true },
    });

    const bookingIds = vendorBookings.map((b: { id: string }) => b.id);

    // Get recent activity logs for these bookings
    const activities = await prisma.activityLog.findMany({
      where: {
        bookingId: { in: bookingIds },
      },
      include: {
        booking: {
          select: {
            id: true,
            customerName: true,
            date: true,
            status: true,
          },
        },
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ activities });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /api/bookings/:id/activity - Get activity for specific booking
router.get('/booking/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Verify user has access to this booking
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        OR: [
          { vendorId: userId },
          { customerId: userId },
        ],
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found or access denied' });
      return;
    }

    // Get all activity for this booking
    const activities = await prisma.activityLog.findMany({
      where: { bookingId: id },
      include: {
        user: {
          select: {
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ activities });
  } catch (error) {
    console.error('Get booking activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
