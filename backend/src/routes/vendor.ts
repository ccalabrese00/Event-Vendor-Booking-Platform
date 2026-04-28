import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  pricingRange: z.string().optional()
})

// Get current vendor profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        description: true,
        category: true,
        pricingRange: true,
        createdAt: true
      }
    })
    
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    
    res.json({ profile: user })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// Update vendor profile
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = profileSchema.parse(req.body)
    
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        description: true,
        category: true,
        pricingRange: true,
        updatedAt: true
      }
    })
    
    res.json({ profile: user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to update profile' })
    }
  }
})

// Upload avatar (placeholder - would use multer/S3 in production)
router.post('/avatar', authenticate, async (req: AuthRequest, res) => {
  res.json({ message: 'Avatar upload endpoint - implement with multer/S3' })
})

// Delete avatar
router.delete('/avatar', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { avatar: null }
    })
    res.json({ message: 'Avatar removed' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove avatar' })
  }
})

// Public: Search vendors (no auth required)
router.get('/search', async (req, res) => {
  try {
    const { category, available, search } = req.query
    
    const where: any = { role: 'VENDOR' }
    
    if (category && typeof category === 'string') {
      where.category = { equals: category, mode: 'insensitive' }
    }
    
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const vendors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        pricingRange: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: { in: ['CONFIRMED', 'COMPLETED'] }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Filter by availability if requested
    let filteredVendors = vendors
    if (available === 'true') {
      const vendorsWithAvailability = await Promise.all(
        vendors.map(async (vendor: typeof vendors[0] & { availCount?: number }) => {
          const availCount = await prisma.availability.count({
            where: {
              vendorId: vendor.id,
              isAvailable: true,
              date: { gte: new Date() }
            }
          })
          return { ...vendor, availCount }
        })
      )
      filteredVendors = vendorsWithAvailability.filter(v => v.availCount > 0)
    }
    
    res.json({ 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vendors: filteredVendors.map((v: any) => ({
        ...v,
        completedBookings: v._count?.bookings || 0,
        _count: undefined
      }))
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to search vendors' })
  }
})

// Public: Get vendor profile by ID (no auth required)
router.get('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params
    
    const vendor = await prisma.user.findFirst({
      where: { 
        id,
        role: 'VENDOR'
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        pricingRange: true,
        avatar: true,
        createdAt: true,
        availability: {
          where: {
            isAvailable: true,
            date: { gte: new Date() }
          },
          orderBy: { date: 'asc' },
          take: 30,
          select: {
            date: true,
            isAvailable: true
          }
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: { in: ['CONFIRMED', 'COMPLETED'] }
              }
            }
          }
        }
      }
    })
    
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' })
      return
    }
    
    const vendorWithCount = vendor as typeof vendor & { _count?: { bookings: number } };
    
    res.json({ 
      vendor: {
        ...vendorWithCount,
        completedBookings: vendorWithCount._count?.bookings || 0,
        _count: undefined
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor profile' })
  }
})

export default router
