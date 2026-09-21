import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

function readTable(filename) {
  try {
    const filePath = path.join(dataDir, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export function getPassengers() {
  const passengers = readTable('passengers.json');
  const families = readTable('families.json');
  
  return passengers.map(p => {
    const fam = families.find(f => f.familyId === p.familyId);
    return {
      ...p,
      familyName: fam ? fam.familyName : 'Unknown'
    };
  });
}

export function getTrains() {
  const allocations = readTable('train_allocations.json');
  const trains = readTable('trains.json');
  
  // Return format expected by the frontend (denormalized)
  return allocations.map(a => {
    const p = readTable('passengers.json').find(x => x.passengerId === a.passengerId);
    const t = trains.find(x => x.trainId === a.trainId);
    return {
      mobile: p ? p.mobile : '',
      coach: a.coachNumber,
      berth: a.berthNumber,
      berthType: a.berthType,
      trainName: t ? t.trainName : '',
      trainNumber: t ? t.trainNumber : ''
    };
  });
}

export function getHotels() {
  const allocations = readTable('hotel_allocations.json');
  const hotels = readTable('hotels.json');
  const rooms = readTable('rooms.json');
  
  return allocations.map(a => {
    const p = readTable('passengers.json').find(x => x.passengerId === a.passengerId);
    const h = hotels.find(x => x.hotelId === a.hotelId);
    const r = rooms.find(x => x.roomId === a.roomId);
    
    return {
      mobile: p ? p.mobile : '',
      day: parseInt(a.day, 10),
      date: a.date,
      hotelName: h ? h.hotelName : '',
      floor: r ? r.floor : '',
      room: r ? r.roomNumber : ''
    };
  });
}

export function findPassengerByMobile(mobile) {
  const passengers = getPassengers();
  return passengers.find(p => p.mobile === mobile) || null;
}

export function getFamilyMembers(familyId) {
  const passengers = getPassengers();
  return passengers.filter(p => p.familyId === familyId);
}

export function getTrainDetails(mobile) {
  const trains = getTrains();
  return trains.find(t => t.mobile === mobile) || null;
}

export function getHotelDetails(mobile) {
  const hotels = getHotels();
  return hotels.filter(h => h.mobile === mobile).sort((a, b) => a.day - b.day);
}

export function getCompleteTripDetails(mobile) {
  const passenger = findPassengerByMobile(mobile);
  
  if (!passenger) {
    return null;
  }
  
  const familyMembers = getFamilyMembers(passenger.familyId);
  
  // Attach train info and hotel info to each family member for the UI
  const familyWithDetails = familyMembers.map(member => {
    return {
      ...member,
      train: getTrainDetails(member.mobile),
      hotels: getHotelDetails(member.mobile)
    };
  });
  
  const trainDetails = getTrainDetails(mobile);
  const hotelDetails = getHotelDetails(mobile);
  
  return {
    passenger,
    family: familyWithDetails,
    train: trainDetails,
    hotels: hotelDetails
  };
}
