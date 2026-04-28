import { dashboardApi } from '../dashboard'
import { apiClient } from '../client'

jest.mock('../client')

describe('dashboardApi', () => {
  const mockDashboardData = {
    stats: {
      totalBookings: 25,
      pendingBookings: 5,
      confirmedBookings: 15,
      completedBookings: 5,
      conversionRate: 75.5,
      monthlyRevenue: 12500,
    },
    recentBookings: [],
    upcomingEvents: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getStats', () => {
    it('fetches dashboard statistics', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: mockDashboardData })

      const result = await dashboardApi.getStats()

      expect(apiClient.get).toHaveBeenCalledWith('/dashboard/stats')
      expect(result).toEqual(mockDashboardData)
    })

    it('returns correct booking counts', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: mockDashboardData })

      const result = await dashboardApi.getStats()

      expect(result.stats.totalBookings).toBe(25)
      expect(result.stats.pendingBookings).toBe(5)
      expect(result.stats.confirmedBookings).toBe(15)
    })

    it('returns revenue data', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: mockDashboardData })

      const result = await dashboardApi.getStats()

      expect(result.stats.monthlyRevenue).toBe(12500)
      expect(result.stats.conversionRate).toBe(75.5)
    })
  })

  describe('getRevenue', () => {
    it('fetches revenue for default 6 months', async () => {
      const mockRevenue = [
        { month: 'Jan', revenue: 2000, bookings: 5 },
        { month: 'Feb', revenue: 2500, bookings: 7 },
      ]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { revenue: mockRevenue } })

      const result = await dashboardApi.getRevenue()

      expect(apiClient.get).toHaveBeenCalledWith('/dashboard/revenue?months=6')
      expect(result).toEqual(mockRevenue)
    })

    it('fetches revenue for custom month range', async () => {
      const mockRevenue = [
        { month: 'Jan', revenue: 2000, bookings: 5 },
        { month: 'Feb', revenue: 2500, bookings: 7 },
        { month: 'Mar', revenue: 3000, bookings: 8 },
      ]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { revenue: mockRevenue } })

      const result = await dashboardApi.getRevenue(3)

      expect(apiClient.get).toHaveBeenCalledWith('/dashboard/revenue?months=3')
      expect(result).toHaveLength(3)
    })

    it('fetches revenue for 12 months', async () => {
      const mockRevenue = Array(12).fill(null).map((_, i) => ({
        month: `Month ${i + 1}`,
        revenue: 1000 * (i + 1),
        bookings: i + 1,
      }))
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { revenue: mockRevenue } })

      const result = await dashboardApi.getRevenue(12)

      expect(apiClient.get).toHaveBeenCalledWith('/dashboard/revenue?months=12')
      expect(result).toHaveLength(12)
    })
  })
})
