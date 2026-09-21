import { NextResponse } from 'next/server';
import { readJson } from '@/lib/data';
import { getPassengers, getTrains, getHotels } from '@/lib/tripData';

export async function GET() {
  const basePassengers = getPassengers();
  const trains = getTrains();
  const hotels = getHotels();

  const passengers = basePassengers.map(p => ({
    ...p,
    train: trains.find(t => t.mobile === p.mobile) || null,
    hotels: hotels.filter(h => h.mobile === p.mobile) || []
  }));

  const families = await readJson('families.json');
  
  const totalPassengers = passengers.length;
  const totalFamilies = families.length;
  
  let assignedSeats = 0;
  let assignedRooms = 0;
  
  let missingTrainCount = 0;
  let missingHotelCount = 0;
  let missingFamilyCount = 0;
  
  for (const p of passengers) {
    if (p.train) assignedSeats++;
    else missingTrainCount++;
    
    if (p.hotels && p.hotels.length > 0) assignedRooms++;
    else missingHotelCount++;
    
    // No family string in data is usually 'Unknown', but let's check F000000
    if (!p.familyId || p.familyId === 'F000000') missingFamilyCount++;
  }
  
  return NextResponse.json({
    totalPassengers,
    totalFamilies,
    assignedSeats,
    assignedRooms,
    missingTrainCount,
    missingHotelCount,
    missingFamilyCount
  });
}
