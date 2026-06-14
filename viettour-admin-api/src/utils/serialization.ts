export function serializeForJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => {
      if (typeof item === 'bigint') return item.toString();
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

export function parseMoney(value: unknown, label = 'amount'): string {
  const raw = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) {
    throw Object.assign(new Error(`${label} must be a positive decimal amount`), { statusCode: 400 });
  }

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw Object.assign(new Error(`${label} must be a positive decimal amount`), { statusCode: 400 });
  }

  return amount.toFixed(2);
}
