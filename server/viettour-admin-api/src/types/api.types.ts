export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { total?: number; page?: number; limit?: number };
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export const ok = <T>(data: T, meta?: object): ApiSuccess<T> =>
  ({ success: true, data, ...(meta && { meta }) });

export const fail = (error: string, code?: string): ApiError =>
  ({ success: false, error, code });
