import { randomBytes } from 'crypto';

/**
 * Creates a (hopefully) unique random string of characters.
 */
export function createUuid(): string {
  const str = randomBytes(6).toString('hex');
  return `${str.substring(0, 4)}-${str.substring(4, 8)}-${str.substring(8)}`;
}

/**
 * Creates a (hopefully) unique unsigned 32-bit integer.
 */
export function createObjectId(): number {
  const bytes = randomBytes(4);
  return bytes.readInt32BE(0);
}
