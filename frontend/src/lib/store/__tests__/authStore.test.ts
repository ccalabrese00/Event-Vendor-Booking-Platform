import { useAuthStore } from '../authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  })

  describe('initial state', () => {
    it('has correct initial state', () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('setAuth', () => {
    it('sets user, token and authentication status', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'VENDOR' as const,
        createdAt: '2024-01-01',
        completedBookings: 0,
      }

      useAuthStore.getState().setAuth(mockUser, 'test-token-123')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('test-token-123')
      expect(state.isAuthenticated).toBe(true)
    })
  })

  describe('logout', () => {
    it('clears user, token and authentication', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'VENDOR' as const,
        createdAt: '2024-01-01',
        completedBookings: 0,
      }

      useAuthStore.getState().setAuth(mockUser, 'test-token')
      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })
})
