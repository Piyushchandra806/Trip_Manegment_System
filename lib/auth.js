import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'trip-management-secret-key-12345';
const key = new TextEncoder().encode(secretKey);

export async function createSession(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
  return token;
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}
