import { NextResponse } from 'next/server';
import { readJson } from '@/lib/data';

export async function GET() {
  const trainAllocations = await readJson('train_allocations.json');
  const coaches = await readJson('coaches.json');
  const passengers = await readJson('passengers.json');
  const families = await readJson('families.json');
  
  const familiesMap = {};
  for (const f of families) {
    familiesMap[f.familyId] = f.familyName;
  }
  
  const passengersMap = {};
  for (const p of passengers) {
    passengersMap[p.passengerId] = {
      ...p,
      familyName: familiesMap[p.familyId] || 'Unknown'
    };
  }

  // Map to hold coach data
  const coachesMap = {};
  for (const c of coaches) {
    coachesMap[c.coachId] = {
      coach: c.coachNumber,
      passengers: []
    };
  }
  
  for (const a of trainAllocations) {
    if (coachesMap[a.coachId]) {
      const p = passengersMap[a.passengerId];
      if (p) {
        coachesMap[a.coachId].passengers.push({
          ...p,
          berth: a.berthNumber,
          berthType: a.berthType
        });
      }
    }
  }

  const coachList = Object.values(coachesMap).sort((a, b) => a.coach.localeCompare(b.coach));

  // Sort passengers in each coach by berth number
  for (const c of coachList) {
    c.passengers.sort((a, b) => parseInt(a.berth) - parseInt(b.berth));
  }

  return NextResponse.json(coachList);
}
