import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import crypto from 'crypto';

// Connect to Upstash Redis if configured
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Initialize limiters
const passengerLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        parseInt(process.env.RATE_LIMIT_PASSENGER_REQS || '20', 10),
        process.env.RATE_LIMIT_PASSENGER_WINDOW || '1 m'
      ),
      analytics: true,
    })
  : null;

// Network-level limiter to prevent brute force while allowing shared Wi-Fi
const networkLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        parseInt(process.env.RATE_LIMIT_NETWORK_REQS || '500', 10),
        process.env.RATE_LIMIT_NETWORK_WINDOW || '1 m'
      ),
      analytics: true,
    })
  : null;

const loginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        parseInt(process.env.RATE_LIMIT_LOGIN_REQS || '5', 10),
        process.env.RATE_LIMIT_LOGIN_WINDOW || '5 m'
      ),
      analytics: true,
    })
  : null;

const setupLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        parseInt(process.env.RATE_LIMIT_SETUP_REQS || '5', 10),
        process.env.RATE_LIMIT_SETUP_WINDOW || '10 m'
      ),
      analytics: true,
    })
  : null;

export function getClientIp(request) {
  // Extract real client IP based on hosting platform headers
  // Vercel appends the true client IP to the END of x-forwarded-for, not the beginning.
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',');
    return ips[ips.length - 1].trim(); // Safest against spoofing on Vercel
  }
  
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  
  return '127.0.0.1'; // Fallback
}

export async function checkRateLimit(request, type = 'passenger') {
  const ip = getClientIp(request);
  let identifier = `${type}:${ip}`;

  // Fallback if Redis env vars are missing
  if (!redis) {
    console.warn(`[RateLimit] Redis is not configured. Falling back to fail strategy for ${type}.`);
    if (type === 'login' || type === 'setup') {
      return { success: false, status: 503, error: 'Rate limiting service unavailable. Access denied for security.' };
    }
    return { success: true };
  }

  // Handle passenger search uniquely to support shared Wi-Fi
  if (type === 'passenger') {
    const url = new URL(request.url);
    const mobile = url.searchParams.get('mobile') || 'unknown';
    
    // Hash mobile so it's not stored in plain text in Redis
    const hashedMobile = crypto.createHash('sha256').update(mobile).digest('hex');
    
    // Specific search limit (e.g. 20 reqs/min per IP + Mobile combo)
    const searchIdentifier = `passenger:${ip}:${hashedMobile}`;
    // Global network limit (e.g. 100 reqs/min per IP) to prevent IP brute force
    const networkIdentifier = `network:${ip}`;
    
    try {
      if (networkLimiter) {
        const netResult = await networkLimiter.limit(networkIdentifier);
        if (!netResult.success) {
          return { success: false, status: 429, error: 'Too many requests from this network. Please wait a moment.' };
        }
      }
      
      const searchResult = await passengerLimiter.limit(searchIdentifier);
      if (!searchResult.success) {
        return { success: false, status: 429, error: 'Too many requests for this search. Please wait a moment and try again.' };
      }
      return { success: true };
    } catch (err) {
      console.error(`[RateLimit] Error for passenger limit:`, err);
      return { success: true }; // Fail open for passenger search
    }
  }

  let limiter;
  let failOpen = true;

  switch (type) {
    case 'login':
      limiter = loginLimiter;
      failOpen = false;
      break;
    case 'setup':
      limiter = setupLimiter;
      failOpen = false;
      break;
    default:
      limiter = passengerLimiter;
      failOpen = true;
      break;
  }

  try {
    const result = await limiter.limit(identifier);
    if (!result.success) {
      return { success: false, status: 429, error: 'Too many requests. Please wait a moment and try again.' };
    }
    return { success: true };
  } catch (err) {
    console.error(`[RateLimit] Error for ${type}:`, err);
    if (failOpen) return { success: true };
    return { success: false, status: 503, error: 'Rate limiting service unavailable. Access denied for security.' };
  }
}
