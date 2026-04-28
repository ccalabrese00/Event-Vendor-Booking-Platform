import { authApi } from '../auth';
import { apiClient } from '../client';
import { User } from '@/types';

jest.mock('../client');

describe('authApi', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CUSTOMER',
    createdAt: new Date().toISOString(),
  };

  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login user and store token', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { user: mockUser, token: mockToken },
      });

      const result = await authApi.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual({ user: mockUser, token: mockToken });
      expect(localStorage.getItem('token')).toBe(mockToken);
    });

    it('should handle login error', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      await expect(authApi.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register user and store token', async () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        role: 'CUSTOMER' as const,
        name: 'New User',
      };
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { user: mockUser, token: mockToken },
      });

      const result = await authApi.register(registerData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual({ user: mockUser, token: mockToken });
      expect(localStorage.getItem('token')).toBe(mockToken);
    });
  });

  describe('logout', () => {
    it('should logout user and remove token', async () => {
      localStorage.setItem('token', mockToken);
      (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });

      await authApi.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { user: mockUser } });

      const result = await authApi.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('token', mockToken);
      expect(authApi.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      expect(authApi.isAuthenticated()).toBe(false);
    });

    it('should return false on server side', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(authApi.isAuthenticated()).toBe(false);
      global.window = originalWindow;
    });
  });

  describe('getToken', () => {
    it('should return token when exists', () => {
      localStorage.setItem('token', mockToken);
      expect(authApi.getToken()).toBe(mockToken);
    });

    it('should return null when token does not exist', () => {
      expect(authApi.getToken()).toBeNull();
    });

    it('should return null on server side', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(authApi.getToken()).toBeNull();
      global.window = originalWindow;
    });
  });
});
