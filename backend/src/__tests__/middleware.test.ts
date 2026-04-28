import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../middleware/requestLogger';
import { errorHandler } from '../middleware/errorHandler';
import { logger } from '../../lib/logger';

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent'),
    };
    mockRes = {
      statusCode: 200,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
        return mockRes as Response;
      }),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('requestLogger', () => {
    it('should log request details', () => {
      requestLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          status: 200,
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          duration: expect.stringMatching(/\\d+ms/),
        }),
        'Request completed'
      );
    });
  });

  describe('errorHandler', () => {
    it('should handle errors and log them', () => {
      const error = new Error('Test error');
      const jsonMock = jest.fn();
      mockRes.json = jsonMock;
      mockRes.status = jest.fn().mockReturnValue(mockRes);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
          url: '/api/test',
          method: 'GET',
          ip: '127.0.0.1',
        }),
        'Unhandled error'
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
