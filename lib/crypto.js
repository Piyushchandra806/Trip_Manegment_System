import crypto from 'crypto';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password, hash) {
  try {
    const [salt, key] = hash.split(':');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return key === derivedKey;
  } catch (err) {
    return false;
  }
}
