import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled error:', err.message, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    error: 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
};
