import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/data';
import { generateId } from '@/lib/idUtils';
import { getTrains } from '@/lib/tripData';

export async function PUT(request, context) {
  const params = await context.params;
  const { mobile } = params;
  const { coach, berth, berthType } = await request.json();

  const passengers = await readJson('passengers.json');
  const passenger = passengers.find(p => p.mobile === mobile);
  if (!passenger) {
    return NextResponse.json({ success: false, error: 'Passenger not found' }, { status: 404 });
  }

  const trains = await readJson('trains.json');
  const coaches = await readJson('coaches.json');
  const trainAllocations = await readJson('train_allocations.json');

  let trainName = "Demo Express";
  let trainNumber = "12345";
  
  let train = trains.find(t => t.trainName === trainName && t.trainNumber === trainNumber);
  if (!train) {
    train = { trainId: generateId('T', trains, 'trainId'), trainName, trainNumber };
    trains.push(train);
    await writeJson('trains.json', trains);
  }

  let coachObj = coaches.find(c => c.trainId === train.trainId && c.coachNumber === coach);
  if (!coachObj) {
    coachObj = { coachId: generateId('C', coaches, 'coachId'), trainId: train.trainId, coachNumber: coach, coachType: "Sleeper" };
    coaches.push(coachObj);
    await writeJson('coaches.json', coaches);
  }

  const allocIndex = trainAllocations.findIndex(a => a.passengerId === passenger.passengerId);
  if (allocIndex !== -1) {
    trainAllocations[allocIndex].trainId = train.trainId;
    trainAllocations[allocIndex].coachId = coachObj.coachId;
    trainAllocations[allocIndex].coachNumber = coach;
    trainAllocations[allocIndex].berthNumber = berth;
    trainAllocations[allocIndex].berthType = berthType;
  } else {
    trainAllocations.push({
      allocationId: generateId('A', trainAllocations, 'allocationId'),
      passengerId: passenger.passengerId,
      trainId: train.trainId,
      coachId: coachObj.coachId,
      coachNumber: coach,
      berthNumber: berth,
      berthType: berthType
    });
  }

  await writeJson('train_allocations.json', trainAllocations);
  return NextResponse.json({ success: true });
}
