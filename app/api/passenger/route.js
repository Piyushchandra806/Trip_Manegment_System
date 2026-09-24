import { NextResponse } from 'next/server';
import { countPassengersByMobile, getCompleteTripDetails } from '@/lib/tripData';

import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request) {
  // Distributed rate limiting
  const rateLimitResult = await checkRateLimit(request, 'passenger');
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: rateLimitResult.error },
      { status: rateLimitResult.status }
    );
  }

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
