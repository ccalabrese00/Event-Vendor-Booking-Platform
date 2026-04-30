import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

const availabilitySchema = z.object({
  date: z.string().datetime(),
  status: z.enum(['AVAILABLE', 'BOOKED', 'BLOCKED']).default('AVAILABLE'),
});

const updateSchema = z.object({
  status: z.enum(['AVAILABLE', 'BOOKED', 'BLOCKED']),
});

// Get vendor availability
router.get('/', authenticate, async (req, res) => {
  try {
    const { start, end } = req.query;
    const where: any = { vendorId: req.userId };

    if (start && end) {
      where.date = {
        gte: new Date(start as string),
        lte: new Date(end as string),
      };
    }

    const availability = await prisma.availability.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    res.json({ availability });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Create availability slot
router.post('/', authenticate, async (req, res) => {
  try {
    const data = availabilitySchema.parse(req.body);

    const availability = await prisma.availability.create({
      data: {
        vendorId: req.userId!,
        date: new Date(data.date),
        status: data.status,
      },
    });

    res.status(201).json(availability);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create availability' });
  }
});

// Update availability
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const data = updateSchema.parse(req.body);

    const availability = await prisma.availability.findFirst({
      where: {
        id: req.params.id,
        vendorId: req.userId,
      },
    });

    if (!availability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    const updated = await prisma.availability.update({
      where: { id: req.params.id },
      data: { status: data.status },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Delete availability
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const availability = await prisma.availability.findFirst({
      where: {
        id: req.params.id,
        vendorId: req.userId,
      },
    });

    if (!availability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    await prisma.availability.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Availability deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete availability' });
  }
});

export default router;
