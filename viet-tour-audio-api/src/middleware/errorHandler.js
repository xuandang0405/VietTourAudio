import { ZodError } from 'zod';

export function notFound(req, res) {
  return res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.issues });
  }

  if (err?.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const status = Number(err?.statusCode ?? err?.status ?? 500);
  return res.status(status).json({
    error: err?.message ?? 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && err?.stack ? { details: err.stack } : {})
  });
}
