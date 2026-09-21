import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/data';
import { generateId } from '@/lib/idUtils';

async function resolveHotelAndRoom(hotelName, floor, room) {
  const hotels = await readJson('hotels.json');
  const rooms = await readJson('rooms.json');
  
  let hotelObj = hotels.find(h => h.hotelName === hotelName);
  if (!hotelObj) {
    hotelObj = { hotelId: generateId('H', hotels, 'hotelId'), hotelName };
    hotels.push(hotelObj);
    await writeJson('hotels.json', hotels);
  }

  let roomObj = rooms.find(r => r.hotelId === hotelObj.hotelId && r.floor === floor.toString() && r.roomNumber === room.toString());
  if (!roomObj) {
    roomObj = { roomId: generateId('R', rooms, 'roomId'), hotelId: hotelObj.hotelId, floor: floor.toString(), roomNumber: room.toString() };
    rooms.push(roomObj);
    await writeJson('rooms.json', rooms);
  }

  return { hotelId: hotelObj.hotelId, roomId: roomObj.roomId };
}

export async function POST(request, context) {
  const params = await context.params;
  const { mobile } = params;
  const { day, date, hotelName, floor, room } = await request.json();

  const passengers = await readJson('passengers.json');
  const passenger = passengers.find(p => p.mobile === mobile);
  if (!passenger) {
    return NextResponse.json({ success: false, error: 'Passenger not found' }, { status: 404 });
  }

  const { hotelId, roomId } = await resolveHotelAndRoom(hotelName, floor, room);

  const hotelAllocations = await readJson('hotel_allocations.json');
  const exists = hotelAllocations.some(ha => ha.passengerId === passenger.passengerId && ha.day === day.toString());
  if (exists) {
    return NextResponse.json({ success: false, error: 'Stay for this day already exists' }, { status: 400 });
  }

  hotelAllocations.push({
    hotelAllocationId: generateId('HA', hotelAllocations, 'hotelAllocationId'),
    passengerId: passenger.passengerId,
    hotelId,
    roomId,
    day: day.toString(),
    date: date || ""
  });

  await writeJson('hotel_allocations.json', hotelAllocations);
  return NextResponse.json({ success: true });
}
