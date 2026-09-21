import { connectToDatabase } from './mongodb';

export async function getCompleteTripDetails(mobile) {
  const { db } = await connectToDatabase();
  
  // 1. Find passenger
  const passenger = await db.collection('passengers').findOne({ mobile });
  if (!passenger) return null;

  // 2. Find family members
  let familyMembers = [];
  if (passenger.familyId) {
    familyMembers = await db.collection('passengers').find({ familyId: passenger.familyId }).toArray();
  }

  // 3. Helper to fetch train details for a passenger
  const getTrainDetailsForPassenger = async (passId) => {
    const alloc = await db.collection('trainAllocations').findOne({ passengerId: passId });
    if (!alloc) return null;
    const train = await db.collection('trains').findOne({ trainId: alloc.trainId });
    return {
      coach: alloc.coachNumber,
      berth: alloc.berthNumber,
      berthType: alloc.berthType,
      trainName: train ? train.trainName : '',
      trainNumber: train ? train.trainNumber : ''
    };
  };

  // 4. Helper to fetch hotel details for a passenger
  const getHotelDetailsForPassenger = async (passId) => {
    const allocs = await db.collection('hotelAllocations').find({ passengerId: passId }).toArray();
    const results = [];
    for (const a of allocs) {
      const hotel = await db.collection('hotels').findOne({ hotelId: a.hotelId });
      const room = await db.collection('rooms').findOne({ roomId: a.roomId });
      results.push({
        day: parseInt(a.day, 10),
        date: a.date,
        hotelName: hotel ? hotel.hotelName : '',
        floor: room ? room.floor : '',
        room: room ? room.roomNumber : ''
      });
    }
    return results.sort((a, b) => a.day - b.day);
  };

  // 5. Build full family response
  const familyWithDetails = await Promise.all(familyMembers.map(async (member) => {
    return {
      ...member,
      train: await getTrainDetailsForPassenger(member.passengerId),
      hotels: await getHotelDetailsForPassenger(member.passengerId)
    };
  }));

  const trainDetails = await getTrainDetailsForPassenger(passenger.passengerId);
  const hotelDetails = await getHotelDetailsForPassenger(passenger.passengerId);

  return {
    passenger,
    family: familyWithDetails,
    train: trainDetails,
    hotels: hotelDetails
  };
}
