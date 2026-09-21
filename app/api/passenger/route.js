import { NextResponse } from 'next/server';
import { getCompleteTripDetails } from '@/lib/tripData';

// Simple in-memory rate limiter
const rateLimitMap = new Map();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

function maskMobile(mobile) {
  if (!mobile || mobile.length < 4) return mobile;
  return 'XXXXXX' + mobile.slice(-4);
}

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  // Rate Limiting Logic
  if (rateLimitMap.has(ip)) {
    const data = rateLimitMap.get(ip);
    if (now - data.timestamp < WINDOW_MS) {
      if (data.count >= MAX_REQUESTS) {
        return NextResponse.json({ error: 'Too many requests. Please wait a moment and try again.' }, { status: 429 });
      }
      data.count++;
      rateLimitMap.set(ip, data);
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
  }

  // Cleanup old entries randomly to prevent memory leak
  if (Math.random() < 0.1) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.timestamp > WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  const { searchParams } = new URL(request.url);
  const mobile = searchParams.get('mobile');

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return NextResponse.json({ error: 'Valid 10-digit mobile number is required' }, { status: 400 });
  }

  try {
    const details = await getCompleteTripDetails(mobile);

    if (!details) {
      return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }

    // Sanitize passenger data
    const sanitizedDetails = {
      passenger: {
        name: details.passenger.name,
        mobile: maskMobile(details.passenger.mobile),
      },
      train: details.train,
      hotels: details.hotels,
      family: details.family ? details.family.map(m => ({
        name: m.name,
        mobile: maskMobile(m.mobile),
        train: m.train,
        hotels: m.hotels
      })) : []
    };

    return NextResponse.json(sanitizedDetails, { status: 200 });
  } catch (error) {
    console.error('Error fetching passenger details:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
