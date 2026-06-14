import { Prisma } from '@prisma/client';

export function serializeForJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => {
      if (typeof item === 'bigint') return item.toString();
      if (item instanceof Prisma.Decimal) return item.toString();
      if (item instanceof Date) return item.toISOString();
      return item;
    })
  );
}

export function toBigIntId(value: unknown, label = 'id'): bigint {
  if (Array.isArray(value) || value === undefined || value === '') {
    throw Object.assign(new Error(`Invalid ${label}`), { statusCode: 400 });
  }

  try {
    return BigInt(value as string | number | bigint);
  } catch {
    throw Object.assign(new Error(`Invalid ${label}`), { statusCode: 400 });
  }
}

export function requireReason(reason: unknown, label = 'reason'): string {
  if (typeof reason !== 'string' || !reason.trim()) {
    throw Object.assign(new Error(`${label} is required`), { statusCode: 400 });
  }
  return reason.trim();
}

export function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error(`${label} is required`), { statusCode: 400 });
  }
  return value.trim();
}

export function parseMoney(value: unknown, label = 'amount'): Prisma.Decimal {
  try {
    const decimal = new Prisma.Decimal(String(value));
    if (!decimal.isFinite() || decimal.lte(0)) {
      throw new Error('Amount must be positive');
    }
    return decimal.toDecimalPlaces(2);
  } catch {
    throw Object.assign(new Error(`${label} must be a positive decimal amount`), { statusCode: 400 });
  }
}
