import { NextResponse } from 'next/server';
import { countPassengersByMobile, getCompleteTripDetails } from '@/lib/tripData';

// Simple in-memory rate limiter
const rateLimitMap = new Map();
const MAX_REQUESTS = 50;
const WINDOW_MS = 60 * 1000; // 1 minute

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Clean up old entries
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.startTime > WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }

  // Rate limiting logic
  let limitData = rateLimitMap.get(ip) || { count: 0, startTime: now };
  if (now - limitData.startTime > WINDOW_MS) {
    limitData = { count: 0, startTime: now };
  }
  
  if (limitData.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429 }
    );
  }
  
  limitData.count++;
  rateLimitMap.set(ip, limitData);

  const { searchParams } = new URL(request.url);
  const mobile = searchParams.get('mobile');
  const name = searchParams.get('name');

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return NextResponse.json({ error: 'Valid 10-digit mobile number is required' }, { status: 400 });
  }

  try {
    const count = await countPassengersByMobile(mobile);
    if (count > 4 && !name) {
      return NextResponse.json({ requireName: true }, { status: 200 });
    }

    const details = await getCompleteTripDetails(mobile, name);

    if (details && details.type === 'MULTIPLE_MATCHES') {
      return NextResponse.json({ 
        error: 'Multiple passengers found. Please enter your full name.',
        multipleMatches: true 
      }, { status: 409 });
    }

    if (!details) {
      return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }

    return NextResponse.json(details, { status: 200 });
  } catch (error) {
    console.error('Passenger search error:', error);
    return NextResponse.json({ error: 'Failed to search passenger' }, { status: 500 });
  }
}
