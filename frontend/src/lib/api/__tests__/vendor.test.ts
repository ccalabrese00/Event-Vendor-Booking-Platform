import { vendorApi } from '../vendor'
import { apiClient } from '../client'

jest.mock('../client')

describe('vendorApi', () => {
  const mockVendor = {
    id: '1',
    name: 'Test Vendor',
    email: 'vendor@test.com',
    category: 'photography',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('search', () => {
    it('searches vendors without filters', async () => {
      const mockVendors = [mockVendor]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { vendors: mockVendors } })

      const result = await vendorApi.search()

      expect(apiClient.get).toHaveBeenCalledWith('/vendor/search?')
      expect(result).toEqual(mockVendors)
    })

    it('searches with category filter', async () => {
      const mockVendors = [mockVendor]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { vendors: mockVendors } })

      await vendorApi.search({ category: 'photography' })

      expect(apiClient.get).toHaveBeenCalledWith('/vendor/search?category=photography')
    })

    it('searches with available filter', async () => {
      const mockVendors = [mockVendor]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { vendors: mockVendors } })

      await vendorApi.search({ available: true })

      expect(apiClient.get).toHaveBeenCalledWith('/vendor/search?available=true')
    })

    it('searches with search query', async () => {
      const mockVendors = [mockVendor]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { vendors: mockVendors } })

      await vendorApi.search({ search: 'john' })

      expect(apiClient.get).toHaveBeenCalledWith('/vendor/search?search=john')
    })

    it('searches with multiple filters', async () => {
      const mockVendors = [mockVendor]
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { vendors: mockVendors } })

      await vendorApi.search({ category: 'music', available: true, search: 'dj' })

      expect(apiClient.get).toHaveBeenCalledWith('/vendor/search?category=music&available=true&search=dj')
    })
  })

  describe('getProfile', () => {
    it('fetches vendor profile by id', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { vendor: mockVendor } })

      const result = await vendorApi.getProfile('1')

      expect(apiClient.get).toHaveBeenCalledWith('/vendor/1/profile')
      expect(result).toEqual(mockVendor)
    })
  })

  describe('getMyProfile', () => {
    it('fetches current vendor profile', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { profile: mockVendor } })

      const result = await vendorApi.getMyProfile()

      expect(apiClient.get).toHaveBeenCalledWith('/vendor/profile')
      expect(result).toEqual(mockVendor)
    })
  })

  describe('updateProfile', () => {
    it('updates vendor profile', async () => {
      const updateData = { name: 'Updated Name' }
      ;(apiClient.put as jest.Mock).mockResolvedValue({ data: { profile: { ...mockVendor, ...updateData } } })

      const result = await vendorApi.updateProfile(updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/vendor/profile', updateData)
      expect(result.name).toBe('Updated Name')
    })
  })
})
