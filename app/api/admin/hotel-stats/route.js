import { NextResponse } from 'next/server';
import { readJson } from '@/lib/data';

export async function GET() {
  const hotelAllocations = await readJson('hotel_allocations.json');
  const hotels = await readJson('hotels.json');
  const rooms = await readJson('rooms.json');
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
  
  const hotelsMap = {};
  for (const h of hotels) {
    hotelsMap[h.hotelId] = {
      name: h.hotelName,
      assignedRooms: 0,
      rooms: []
    };
  }

  // Group passengers by room
  const roomGroups = {}; // key: roomId, value: { room: roomObj, passengers: [] }
  
  for (const a of hotelAllocations) {
    const hotel = hotelsMap[a.hotelId];
    if (!hotel) continue;
    
    if (!roomGroups[a.roomId]) {
       const room = rooms.find(r => r.roomId === a.roomId);
       if (!room) continue;
       roomGroups[a.roomId] = { room, passengers: [] };
    }
    
    const passenger = passengersMap[a.passengerId];
    if (passenger && !roomGroups[a.roomId].passengers.find(p => p.passengerId === passenger.passengerId)) {
       roomGroups[a.roomId].passengers.push(passenger);
    }
  }
  
  // Build final array
  for (const [roomId, data] of Object.entries(roomGroups)) {
     const hotel = hotelsMap[data.room.hotelId];
     if (hotel) {
       hotel.assignedRooms += 1;
       hotel.rooms.push({
         roomId: data.room.roomId,
         floor: data.room.floor,
         room: data.room.roomNumber,
         passengers: data.passengers
       });
     }
  }

  // Sort rooms
  for (const h of Object.values(hotelsMap)) {
    h.rooms.sort((a, b) => parseInt(a.room) - parseInt(b.room));
  }

  return NextResponse.json(Object.values(hotelsMap));
}
