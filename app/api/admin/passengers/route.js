import { NextResponse } from 'next/server';
import { getPassengers, getTrains, getHotels } from '@/lib/tripData';

export async function GET() {
  const passengers = getPassengers();
  const trains = getTrains();
  const hotels = getHotels();

  // Enrich passengers with train and hotel info
  const enriched = passengers.map(p => ({
    ...p,
    train: trains.find(t => t.mobile === p.mobile) || null,
    hotels: hotels.filter(h => h.mobile === p.mobile) || []
  }));

  return NextResponse.json(enriched);
}
