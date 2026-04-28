import { customerApi } from '../customer'
import { apiClient } from '../client'

jest.mock('../client')

describe('customerApi', () => {
  const mockBooking = {
    id: '1',
    vendorId: 'vendor-1',
    customerName: 'John Doe',
    customerEmail: 'john@test.com',
    date: '2024-01-15',
    status: 'CONFIRMED',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getBookings', () => {
    it('fetches customer bookings by email', async () => {
      const mockBookings = [mockBooking]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { bookings: mockBookings } })

      const result = await customerApi.getBookings('john@test.com')

      expect(apiClient.get).toHaveBeenCalledWith('/customer?email=john%40test.com')
      expect(result).toEqual(mockBookings)
    })

    it('handles email with special characters', async () => {
      const mockBookings = [mockBooking]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { bookings: mockBookings } })

      await customerApi.getBookings('john+test@example.com')

      expect(apiClient.get).toHaveBeenCalledWith('/customer?email=john%2Btest%40example.com')
    })

    it('returns empty array when no bookings', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { bookings: [] } })

      const result = await customerApi.getBookings('new@test.com')

      expect(result).toEqual([])
    })
  })

  describe('getBooking', () => {
    it('fetches specific booking by id and email', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { booking: mockBooking } })

      const result = await customerApi.getBooking('1', 'john@test.com')

      expect(apiClient.get).toHaveBeenCalledWith('/customer/1?email=john%40test.com')
      expect(result).toEqual(mockBooking)
    })

    it('handles booking not found', async () => {
      ;(apiClient.get as jest.Mock).mockRejectedValue(new Error('Booking not found'))

      await expect(customerApi.getBooking('999', 'john@test.com')).rejects.toThrow('Booking not found')
    })
  })
})
