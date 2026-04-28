import { bookingsApi } from '../bookings'
import { apiClient } from '../client'

jest.mock('../client')

describe('bookingsApi', () => {
  const mockBooking = {
    id: '1',
    vendorId: 'vendor-1',
    customerName: 'John Doe',
    customerEmail: 'john@test.com',
    date: '2024-01-15',
    status: 'PENDING',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('fetches all bookings without filters', async () => {
      const mockBookings = [mockBooking]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { bookings: mockBookings } })

      const result = await bookingsApi.getAll()

      expect(apiClient.get).toHaveBeenCalledWith('/bookings?')
      expect(result).toEqual(mockBookings)
    })

    it('fetches bookings with status filter', async () => {
      const mockBookings = [mockBooking]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { bookings: mockBookings } })

      await bookingsApi.getAll({ status: 'PENDING' })

      expect(apiClient.get).toHaveBeenCalledWith('/bookings?status=PENDING')
    })

    it('fetches bookings with date range', async () => {
      const mockBookings = [mockBooking]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { bookings: mockBookings } })

      await bookingsApi.getAll({ startDate: '2024-01-01', endDate: '2024-01-31' })

      expect(apiClient.get).toHaveBeenCalledWith('/bookings?startDate=2024-01-01&endDate=2024-01-31')
    })

    it('fetches bookings with all filters', async () => {
      const mockBookings = [mockBooking]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { bookings: mockBookings } })

      await bookingsApi.getAll({ status: 'CONFIRMED', startDate: '2024-01-01', endDate: '2024-12-31' })

      expect(apiClient.get).toHaveBeenCalledWith('/bookings?status=CONFIRMED&startDate=2024-01-01&endDate=2024-12-31')
    })
  })

  describe('getById', () => {
    it('fetches booking by id', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { booking: mockBooking } })

      const result = await bookingsApi.getById('1')

      expect(apiClient.get).toHaveBeenCalledWith('/bookings/1')
      expect(result).toEqual(mockBooking)
    })
  })

  describe('create', () => {
    it('creates a new booking', async () => {
      const bookingData = {
        vendorId: 'vendor-1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@test.com',
        customerPhone: '555-1234',
        date: '2024-02-15',
        message: 'Please confirm availability',
      }
      ;(apiClient.post as jest.Mock).mockResolvedValue({ data: { booking: { ...mockBooking, ...bookingData } } })

      const result = await bookingsApi.create(bookingData)

      expect(apiClient.post).toHaveBeenCalledWith('/bookings', bookingData)
      expect(result.customerName).toBe('Jane Doe')
    })

    it('creates booking without optional fields', async () => {
      const bookingData = {
        vendorId: 'vendor-1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@test.com',
        date: '2024-02-15',
      }
      ;(apiClient.post as jest.Mock).mockResolvedValue({ data: { booking: { ...mockBooking, ...bookingData } } })

      const result = await bookingsApi.create(bookingData)

      expect(apiClient.post).toHaveBeenCalledWith('/bookings', bookingData)
      expect(result).toBeDefined()
    })
  })

  describe('updateStatus', () => {
    it('updates booking status', async () => {
      ;(apiClient.put as jest.Mock).mockResolvedValue({ data: { booking: { ...mockBooking, status: 'CONFIRMED' } } })

      const result = await bookingsApi.updateStatus('1', 'CONFIRMED')

      expect(apiClient.put).toHaveBeenCalledWith('/bookings/1', { status: 'CONFIRMED' })
      expect(result.status).toBe('CONFIRMED')
    })

    it('can set status to CANCELLED', async () => {
      ;(apiClient.put as jest.Mock).mockResolvedValue({ data: { booking: { ...mockBooking, status: 'CANCELLED' } } })

      const result = await bookingsApi.updateStatus('1', 'CANCELLED')

      expect(apiClient.put).toHaveBeenCalledWith('/bookings/1', { status: 'CANCELLED' })
      expect(result.status).toBe('CANCELLED')
    })
  })

  describe('updatePayment', () => {
    it('updates payment status', async () => {
      ;(apiClient.put as jest.Mock).mockResolvedValue({ data: { booking: { ...mockBooking, paymentStatus: 'PAID' } } })

      const result = await bookingsApi.updatePayment('1', 'PAID')

      expect(apiClient.put).toHaveBeenCalledWith('/bookings/1/payment', { paymentStatus: 'PAID', amount: undefined })
      expect(result.paymentStatus).toBe('PAID')
    })

    it('updates payment with amount', async () => {
      ;(apiClient.put as jest.Mock).mockResolvedValue({ data: { booking: { ...mockBooking, paymentStatus: 'PAID', amount: 500 } } })

      const result = await bookingsApi.updatePayment('1', 'PAID', 500)

      expect(apiClient.put).toHaveBeenCalledWith('/bookings/1/payment', { paymentStatus: 'PAID', amount: 500 })
      expect(result.paymentStatus).toBe('PAID')
    })

    it('can set payment to REFUNDED', async () => {
      ;(apiClient.put as jest.Mock).mockResolvedValue({ data: { booking: { ...mockBooking, paymentStatus: 'REFUNDED' } } })

      const result = await bookingsApi.updatePayment('1', 'REFUNDED', 500)

      expect(apiClient.put).toHaveBeenCalledWith('/bookings/1/payment', { paymentStatus: 'REFUNDED', amount: 500 })
      expect(result.paymentStatus).toBe('REFUNDED')
    })
  })
})
