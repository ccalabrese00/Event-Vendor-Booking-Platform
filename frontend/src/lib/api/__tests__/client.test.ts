import { apiClient } from '../client'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.location
const locationMock = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true,
})

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    locationMock.href = ''
  })

  it('exports apiClient', () => {
    expect(apiClient).toBeDefined()
  })

  it('has correct base configuration', () => {
    expect(apiClient.defaults.headers).toBeDefined()
    expect(apiClient.defaults.baseURL).toBeDefined()
  })

  it('has Content-Type header set to application/json', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })

  describe('request interceptor', () => {
    it('adds token from localStorage to request headers', async () => {
      localStorageMock.getItem.mockReturnValue('test-token')

      // Simulate a request
      const config = { headers: {} }
      const requestInterceptor = apiClient.interceptors.request.handlers[0]
      const result = await requestInterceptor.fulfilled(config)

      expect(result.headers.Authorization).toBe('Bearer test-token')
    })

    it('does not add Authorization header when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const config = { headers: {} }
      const requestInterceptor = apiClient.interceptors.request.handlers[0]
      const result = await requestInterceptor.fulfilled(config)

      expect(result.headers.Authorization).toBeUndefined()
    })
  })

  describe('response interceptor', () => {
    it('returns response on success', async () => {
      const mockResponse = { data: { success: true } }
      const responseInterceptor = apiClient.interceptors.response.handlers[0]
      const result = await responseInterceptor.fulfilled(mockResponse)

      expect(result).toEqual(mockResponse)
    })

    it('redirects to login on 401 error', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      }
      localStorageMock.removeItem.mockImplementation(() => {})

      const responseInterceptor = apiClient.interceptors.response.handlers[0]
      
      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(locationMock.href).toBe('/login')
    })

    it('does not redirect on non-401 errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Server Error' },
        },
      }

      const responseInterceptor = apiClient.interceptors.response.handlers[0]
      
      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error)
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
      expect(locationMock.href).toBe('')
    })
  })
})
