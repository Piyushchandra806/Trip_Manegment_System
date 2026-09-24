import crypto from 'crypto';
import util from 'util';

const scryptAsync = util.promisify(crypto.scrypt);

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKeyBuffer = await scryptAsync(password, salt, 64);
  const derivedKey = derivedKeyBuffer.toString('hex');
  return `${salt}:${derivedKey}`;
}

export async function verifyPassword(password, hash) {
  try {
    if (!hash || typeof hash !== 'string') return false;
    const [salt, key] = hash.split(':');
    if (!salt || !key) return false;
    const derivedKeyBuffer = await scryptAsync(password, salt, 64);
    const derivedKey = derivedKeyBuffer.toString('hex');
    return key === derivedKey;
  } catch (err) {
    return false;
  }
}
