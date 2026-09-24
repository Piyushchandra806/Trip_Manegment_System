import { connectToDatabase } from './mongodb.js';
import { isNameMatch } from './nameMatcher.js';
import { getCachedMap } from './staticCache.js';

export async function countPassengersByMobile(mobile) {
  const { db } = await connectToDatabase();
  return await db.collection('passengers').countDocuments({ mobile }, { maxTimeMS: 5000 });
}

export async function getCompleteTripDetails(mobile, name = null) {
  const { db } = await connectToDatabase();
  
  const passengers = await db.collection('passengers').find({ mobile }).maxTimeMS(5000).toArray();
  if (passengers.length === 0) return null;

  let passenger = null;

  if (name) {
    const matches = passengers.filter(p => isNameMatch(name, p.name));
    
    if (matches.length > 1) {
      return { type: 'MULTIPLE_MATCHES' };
    }
    if (matches.length === 1) {
      passenger = matches[0];
    } else {
      return null;
    }
  } else {
    passenger = passengers[0];
  }

  // 2. Find family members
  let familyMembers = [];
  if (passenger.familyId) {
    familyMembers = await db.collection('passengers').find({ familyId: passenger.familyId }).maxTimeMS(5000).toArray();
  }

  // Collect all unique passenger IDs in this request
  const allPassengerIds = new Set(familyMembers.map(m => m.passengerId));
  allPassengerIds.add(passenger.passengerId);
  const passengerIdsArray = Array.from(allPassengerIds);

  // 3. Batch fetch all train allocations
  const trainAllocations = await db.collection('trainAllocations')
    .find({ passengerId: { $in: passengerIdsArray } })
    .maxTimeMS(5000)
    .toArray();
    
  const trainMap = await getCachedMap(db, 'trains');

  // 4. Batch fetch all hotel allocations
  const hotelAllocations = await db.collection('hotelAllocations')
    .find({ passengerId: { $in: passengerIdsArray } })
    .maxTimeMS(5000)
    .toArray();

  const hotelMap = await getCachedMap(db, 'hotels');
  const roomMap = await getCachedMap(db, 'rooms');

  // Helper functions using the pre-fetched maps in memory
  const getTrainDetailsForPassenger = (passId) => {
    const alloc = trainAllocations.find(a => a.passengerId === passId);
    if (!alloc) return null;
    const train = trainMap[alloc.trainId];
    return {
      coach: alloc.coachNumber,
      berth: alloc.berthNumber,
      berthType: alloc.berthType,
      trainName: train ? train.trainName : '',
      trainNumber: train ? train.trainNumber : ''
    };
  };

  const getHotelDetailsForPassenger = (passId) => {
    const allocs = hotelAllocations.filter(a => a.passengerId === passId);
    const results = allocs.map(a => {
      const hotel = hotelMap[a.hotelId];
      const room = roomMap[a.roomId];
      return {
        day: parseInt(a.day, 10),
        date: a.date,
        hotelName: hotel ? hotel.hotelName : '',
        floor: room ? room.floor : '',
        room: room ? room.roomNumber : ''
      };
    });
    return results.sort((a, b) => a.day - b.day);
  };

  // 5. Build full family response
  const familyWithDetails = familyMembers.map((member) => {
    return {
      ...member,
      train: getTrainDetailsForPassenger(member.passengerId),
      hotels: getHotelDetailsForPassenger(member.passengerId)
    };
  });

  const trainDetails = getTrainDetailsForPassenger(passenger.passengerId);
  const hotelDetails = getHotelDetailsForPassenger(passenger.passengerId);

  return {
    passenger,
    family: familyWithDetails,
    train: trainDetails,
    hotels: hotelDetails
  };
}
