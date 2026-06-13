import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.statusCode ? err.message : 'Internal Server Error'
  });
};
