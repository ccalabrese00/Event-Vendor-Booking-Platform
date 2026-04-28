import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

const createBookingSchema = z.object({
  vendorId: z.string().uuid(),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  date: z.string().datetime(),
  message: z.string().max(500).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'CONTRACT_SENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

const updatePaymentSchema = z.object({
  paymentStatus: z.enum(['NONE', 'DEPOSIT_PAID', 'PAID_IN_FULL', 'REFUNDED']),
  amount: z.number().positive().optional(),
});

// GET /api/bookings - Get vendor's bookings (vendor only)
router.get('/', authenticate, requireRole(['VENDOR']), async (req: AuthRequest, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const where: any = { vendorId: req.userId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings - Create a new booking (customer)
router.post('/', async (req, res) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Validate date is in the future
    const bookingDate = new Date(data.date);
    if (bookingDate < new Date()) {
      res.status(400).json({ error: 'Booking date must be in the future' });
      return;
    }

    // Check if vendor exists and is available
    const vendor = await prisma.user.findFirst({
      where: {
        id: data.vendorId,
        role: 'VENDOR',
      },
      include: {
        availability: {
          where: {
            date: bookingDate,
            isAvailable: true,
          },
        },
      },
    });

    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    // Check if date is already booked
    const existingBooking = await prisma.booking.findFirst({
      where: {
        vendorId: data.vendorId,
        date: bookingDate,
        status: { notIn: ['CANCELLED', 'DECLINED'] },
      },
    });

    if (existingBooking) {
      res.status(409).json({ error: 'This date is already booked' });
      return;
    }

    // Create customer user if doesn't exist
    let customer = await prisma.user.findUnique({
      where: { email: data.customerEmail },
    });

    if (!customer) {
      customer = await prisma.user.create({
        data: {
          email: data.customerEmail,
          name: data.customerName,
          role: 'CUSTOMER',
          password: await bcrypt.hash(Math.random().toString(36), 10),
        },
      });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        vendorId: data.vendorId,
        customerId: customer.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        date: bookingDate,
        message: data.message,
        status: 'PENDING',
        paymentStatus: 'NONE',
      },
      include: {
        activities: true,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        bookingId: booking.id,
        userId: customer.id,
        action: 'BOOKING_CREATED',
        description: `Booking request created for ${bookingDate.toDateString()}`,
      },
    });

    // Create notification for vendor
    await prisma.notification.create({
      data: {
        userId: data.vendorId,
        bookingId: booking.id,
        type: 'IN_APP',
        title: 'New Booking Request',
        message: `New booking request from ${data.customerName}`,
      },
    });

    res.status(201).json({ booking, message: 'Booking created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /api/bookings/:id - Get specific booking
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, role: true },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
            email: true,
            phone: true,
            category: true,
          },
        },
        notifications: true,
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check permissions - only vendor or customer can view
    if (booking.vendorId !== req.userId && booking.customerId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PUT /api/bookings/:id - Update booking status (vendor only)
router.put('/:id', authenticate, requireRole(['VENDOR']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateStatusSchema.parse(req.body);

    // Verify vendor owns this booking
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        vendorId: req.userId,
      },
    });

    if (!existingBooking) {
      res.status(404).json({ error: 'Booking not found or access denied' });
      return;
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: data.status },
    });

    // Create activity log
    const activity = await prisma.activityLog.create({
      data: {
        bookingId: id,
        userId: req.userId!,
        action: 'STATUS_UPDATED',
        description: `Status updated to ${data.status}`,
      },
    });

    // If confirmed, mark date as unavailable
    if (data.status === 'CONFIRMED') {
      await prisma.availability.updateMany({
        where: {
          vendorId: req.userId,
          date: booking.date,
        },
        data: { isAvailable: false },
      });
    }

    // Create notification for customer
    await prisma.notification.create({
      data: {
        userId: booking.customerId,
        bookingId: booking.id,
        type: 'IN_APP',
        title: 'Booking Status Updated',
        message: `Your booking status has been updated to ${data.status}`,
      },
    });

    res.json({ booking, activity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// PUT /api/bookings/:id/payment - Update payment status (vendor only)
router.put('/:id/payment', authenticate, requireRole(['VENDOR']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updatePaymentSchema.parse(req.body);

    // Verify vendor owns this booking
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        vendorId: req.userId,
      },
    });

    if (!existingBooking) {
      res.status(404).json({ error: 'Booking not found or access denied' });
      return;
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        paymentStatus: data.paymentStatus,
        price: data.amount || existingBooking.price,
      },
    });

    // Create activity log
    const activity = await prisma.activityLog.create({
      data: {
        bookingId: id,
        userId: req.userId!,
        action: 'PAYMENT_UPDATED',
        description: `Payment status updated to ${data.paymentStatus}${data.amount ? ` ($${data.amount})` : ''}`,
      },
    });

    res.json({ booking, activity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

import bcrypt from 'bcryptjs';

export default router;
