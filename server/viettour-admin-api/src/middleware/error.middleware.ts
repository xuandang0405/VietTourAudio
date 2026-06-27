import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const isFileTooLarge = err?.code === 'LIMIT_FILE_SIZE';
  const statusCode = isFileTooLarge ? 413 : (err.statusCode || 500);
  res.status(statusCode).json({
    success: false,
    error: isFileTooLarge
      ? 'Ảnh tải lên không được vượt quá 5MB.'
      : err.statusCode
        ? err.message
        : 'Internal Server Error'
  });
};
