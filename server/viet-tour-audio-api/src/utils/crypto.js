import { createHash, randomBytes } from 'node:crypto';

export function sha256(input) {
  return createHash('sha256').update(String(input)).digest('hex');
}

export function randomToken(size = 24) {
  return randomBytes(size).toString('hex');
}

export function maskToken(token) {
  return token.slice(0, 12);
}
