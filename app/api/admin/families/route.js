import { NextResponse } from 'next/server';
import { getPassengers, getTrains, getHotels } from '@/lib/tripData';
import { readJson } from '@/lib/data';

export async function GET() {
  const passengers = getPassengers();
  const trains = getTrains();
  const hotels = getHotels();
  const rawFamilies = await readJson('families.json');

  const familiesMap = {};
  for (const f of rawFamilies) {
    familiesMap[f.familyId] = {
      familyId: f.familyId,
      familyName: f.familyName,
      members: []
    };
  }
  
  for (const p of passengers) {
    if (familiesMap[p.familyId]) {
      familiesMap[p.familyId].members.push({
        ...p,
        train: trains.find(t => t.mobile === p.mobile) || null,
        hotels: hotels.filter(h => h.mobile === p.mobile) || []
      });
    }
  }

  return NextResponse.json(Object.values(familiesMap));
}
