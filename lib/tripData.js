import { connectToDatabase } from './mongodb.js';
import { isNameMatch } from './nameMatcher.js';
import { getCachedMap } from './staticCache.js';

export async function countPassengersByMobile(mobile) {
  const { db } = await connectToDatabase();
  return await db.collection('passengers').countDocuments({ mobile }, { maxTimeMS: 5000 });
}

export async function getCompleteTripDetails(mobile) {
  const { db } = await connectToDatabase();
  
  // 1. Find passengers by mobile
  const passengersByMobile = await db.collection('passengers').find({ mobile }).maxTimeMS(5000).toArray();
  if (passengersByMobile.length === 0) return null;

  // 2. Find family members by shared familyId
  const familyIds = [...new Set(passengersByMobile.map(p => p.familyId).filter(Boolean))];
  
  let familyMembers = [];
  if (familyIds.length > 0) {
    familyMembers = await db.collection('passengers').find({ familyId: { $in: familyIds } }).maxTimeMS(5000).toArray();
  }

  // 3. Combine and deduplicate
  const allPassengersMap = new Map();
  passengersByMobile.forEach(p => allPassengersMap.set(p.passengerId, p));
  familyMembers.forEach(p => allPassengersMap.set(p.passengerId, p));

  const passengers = Array.from(allPassengersMap.values());
  const passengerIdsArray = passengers.map(p => p.passengerId);

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

  // 5. Build full response
  const passengersWithDetails = passengers.map((p) => {
    return {
      ...p,
      train: getTrainDetailsForPassenger(p.passengerId),
      hotels: getHotelDetailsForPassenger(p.passengerId)
    };
  });

  return { passengers: passengersWithDetails };
}
