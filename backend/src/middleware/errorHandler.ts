import { Request, Response, NextFunction } from 'express';
import { logger } from '../../lib/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error: ${err.message}, URL: ${req.url}, Method: ${req.method}, IP: ${req.ip}`);

  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    error: 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
};
