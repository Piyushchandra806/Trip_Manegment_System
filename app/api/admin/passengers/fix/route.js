import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/data';
import { generateId } from '@/lib/idUtils';
import { logActivity } from '@/lib/activity';

export async function POST(request) {
  try {
    const data = await request.json();
    const { mobile, fixType, coach, berth, berthType, hotel, floor, room } = data;

    if (!mobile || typeof mobile !== 'string' || mobile.length > 15) {
      return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    }

    const passengers = await readJson('passengers.json');
    const passenger = passengers.find(p => p.mobile === mobile);
    if (!passenger) {
      return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }

    if (fixType === 'train') {
      if (!coach || typeof coach !== 'string' || coach.length > 20) {
        return NextResponse.json({ error: 'Invalid coach' }, { status: 400 });
      }
      if (!berth || typeof berth !== 'string' || berth.length > 10) {
        return NextResponse.json({ error: 'Invalid berth' }, { status: 400 });
      }

      const trains = await readJson('trains.json');
      const coaches = await readJson('coaches.json');
      const trainAllocations = await readJson('train_allocations.json');

      let train = trains.find(t => t.trainName === "Imported Train");
      if (!train) {
        train = { trainId: generateId('T', trains, 'trainId'), trainName: "Imported Train", trainNumber: "00000" };
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
        trainAllocations[allocIndex].coachId = coachObj.coachId;
        trainAllocations[allocIndex].coachNumber = coach;
        trainAllocations[allocIndex].berthNumber = berth;
        trainAllocations[allocIndex].berthType = String(berthType || "Unknown").substring(0, 20);
      } else {
        trainAllocations.push({
          allocationId: generateId('A', trainAllocations, 'allocationId'),
          passengerId: passenger.passengerId,
          trainId: train.trainId,
          coachId: coachObj.coachId,
          coachNumber: coach,
          berthNumber: berth,
          berthType: String(berthType || "Unknown").substring(0, 20)
        });
      }
      await writeJson('train_allocations.json', trainAllocations);
      await logActivity('Fixed Train Seat', `Assigned ${passenger.name} (${passenger.mobile}) to ${coach}/${berth}`);

    } else if (fixType === 'hotel') {
      if (!hotel || typeof hotel !== 'string' || hotel.length > 100) {
        return NextResponse.json({ error: 'Invalid hotel name' }, { status: 400 });
      }
      if (!room || typeof room !== 'string' || room.length > 20) {
        return NextResponse.json({ error: 'Invalid room number' }, { status: 400 });
      }

      const hotels = await readJson('hotels.json');
      const rooms = await readJson('rooms.json');
      const hotelAllocations = await readJson('hotel_allocations.json');

      let hotelObj = hotels.find(h => h.hotelName === hotel);
      if (!hotelObj) {
        hotelObj = { hotelId: generateId('H', hotels, 'hotelId'), hotelName: hotel };
        hotels.push(hotelObj);
        await writeJson('hotels.json', hotels);
      }

      let roomObj = rooms.find(r => r.hotelId === hotelObj.hotelId && r.roomNumber === String(room));
      if (!roomObj) {
        roomObj = { 
          roomId: generateId('R', rooms, 'roomId'), 
          hotelId: hotelObj.hotelId, 
          floor: String(floor || "1").substring(0, 10), 
          roomNumber: String(room) 
        };
        rooms.push(roomObj);
        await writeJson('rooms.json', rooms);
      }

      const day = "1";
      const haIndex = hotelAllocations.findIndex(ha => ha.passengerId === passenger.passengerId && ha.day === day);
      if (haIndex !== -1) {
        hotelAllocations[haIndex].hotelId = hotelObj.hotelId;
        hotelAllocations[haIndex].roomId = roomObj.roomId;
      } else {
        hotelAllocations.push({
          hotelAllocationId: generateId('HA', hotelAllocations, 'hotelAllocationId'),
          passengerId: passenger.passengerId,
          hotelId: hotelObj.hotelId,
          roomId: roomObj.roomId,
          day: day,
          date: ""
        });
      }
      await writeJson('hotel_allocations.json', hotelAllocations);
      await logActivity('Fixed Hotel Room', `Assigned ${passenger.name} (${passenger.mobile}) to ${hotel} Room ${room}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'We couldn\'t complete this operation. Please check the information and try again.' }, { status: 500 });
  }
}
