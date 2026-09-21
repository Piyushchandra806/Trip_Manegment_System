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

export async function PUT(request, context) {
  const params = await context.params;
  const { mobile, day } = params;
  const { hotelName, floor, room } = await request.json();

  const passengers = await readJson('passengers.json');
  const passenger = passengers.find(p => p.mobile === mobile);
  if (!passenger) {
    return NextResponse.json({ success: false, error: 'Passenger not found' }, { status: 404 });
  }

  const { hotelId, roomId } = await resolveHotelAndRoom(hotelName, floor, room);

  const hotelAllocations = await readJson('hotel_allocations.json');
  const index = hotelAllocations.findIndex(ha => ha.passengerId === passenger.passengerId && ha.day === day.toString());
  
  if (index === -1) {
    return NextResponse.json({ success: false, error: 'Hotel stay not found' }, { status: 404 });
  }

  hotelAllocations[index].hotelId = hotelId;
  hotelAllocations[index].roomId = roomId;

  await writeJson('hotel_allocations.json', hotelAllocations);
  return NextResponse.json({ success: true });
}

export async function DELETE(request, context) {
  const params = await context.params;
  const { mobile, day } = params;

  const passengers = await readJson('passengers.json');
  const passenger = passengers.find(p => p.mobile === mobile);
  if (!passenger) {
    return NextResponse.json({ success: false, error: 'Passenger not found' }, { status: 404 });
  }

  let hotelAllocations = await readJson('hotel_allocations.json');
  const initialLength = hotelAllocations.length;
  hotelAllocations = hotelAllocations.filter(ha => !(ha.passengerId === passenger.passengerId && ha.day === day.toString()));
  
  if (hotelAllocations.length === initialLength) {
    return NextResponse.json({ success: false, error: 'Hotel stay not found' }, { status: 404 });
  }

  await writeJson('hotel_allocations.json', hotelAllocations);
  return NextResponse.json({ success: true });
}
