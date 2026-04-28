import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// GET /api/customer?email=xxx - Get customer's bookings by email
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email parameter is required' });
      return;
    }

    // Find customer by email
    const customer = await prisma.user.findUnique({
      where: { email },
    });

    if (!customer) {
      res.status(404).json({ error: 'No bookings found for this email' });
      return;
    }

    // Get all bookings for this customer
    const bookings = await prisma.booking.findMany({
      where: { customerId: customer.id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
            email: true,
            phone: true,
            category: true,
            avatar: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/customer/:id?email=xxx - Get specific booking by ID with email verification
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email parameter is required' });
      return;
    }

    // Find customer by email
    const customer = await prisma.user.findUnique({
      where: { email },
    });

    if (!customer) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Get specific booking
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        customerId: customer.id,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
            email: true,
            phone: true,
            category: true,
            avatar: true,
            description: true,
            location: true,
            website: true,
            pricingRange: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, role: true },
            },
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get customer booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

export default router;
