const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

function generateId(prefix, records, idField) {
  let maxId = 0;
  for (const record of records) {
    const idStr = record[idField];
    if (idStr && idStr.startsWith(prefix)) {
      const num = parseInt(idStr.substring(prefix.length), 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
  }
  const nextId = maxId + 1;
  return `${prefix}${nextId.toString().padStart(6, '0')}`;
}

const oldPassengers = JSON.parse(fs.readFileSync(path.join(dataDir, 'passengers.json'), 'utf8'));
const oldTrain = JSON.parse(fs.readFileSync(path.join(dataDir, 'train.json'), 'utf8'));
const oldHotels = JSON.parse(fs.readFileSync(path.join(dataDir, 'hotels.json'), 'utf8'));

const passengers = [];
const families = [];
const trains = [];
const coaches = [];
const trainAllocations = [];
const hotels = [];
const rooms = [];
const hotelAllocations = [];

// Helper to get or create family
function getOrCreateFamily(familyName) {
  let family = families.find(f => f.familyName === familyName);
  if (!family) {
    family = {
      familyId: generateId('F', families, 'familyId'),
      familyName
    };
    families.push(family);
  }
  return family.familyId;
}

// 1. Migrate Passengers & Families
oldPassengers.forEach(p => {
  const familyId = getOrCreateFamily(p.familyName);
  passengers.push({
    passengerId: generateId('P', passengers, 'passengerId'),
    name: p.name,
    mobile: p.mobile,
    familyId
  });
});

// Helper to get or create train
function getOrCreateTrain(trainName, trainNumber) {
  let train = trains.find(t => t.trainName === trainName && t.trainNumber === trainNumber);
  if (!train) {
    train = {
      trainId: generateId('T', trains, 'trainId'),
      trainName,
      trainNumber
    };
    trains.push(train);
  }
  return train.trainId;
}

// Helper to get or create coach
function getOrCreateCoach(trainId, coachNumber) {
  let coach = coaches.find(c => c.trainId === trainId && c.coachNumber === coachNumber);
  if (!coach) {
    coach = {
      coachId: generateId('C', coaches, 'coachId'),
      trainId,
      coachNumber,
      coachType: "Sleeper" // default assumed from demo
    };
    coaches.push(coach);
  }
  return coach.coachId;
}

// 2. Migrate Train Allocations
oldTrain.forEach(t => {
  const passenger = passengers.find(p => p.mobile === t.mobile);
  if (!passenger) return; // Skip invalid data

  const trainId = getOrCreateTrain(t.trainName, t.trainNumber);
  const coachId = getOrCreateCoach(trainId, t.coach);
  
  trainAllocations.push({
    allocationId: generateId('A', trainAllocations, 'allocationId'),
    passengerId: passenger.passengerId,
    trainId,
    coachId,
    coachNumber: t.coach,
    berthNumber: t.berth,
    berthType: t.berthType
  });
});

// Helper to get or create hotel
function getOrCreateHotel(hotelName) {
  let hotel = hotels.find(h => h.hotelName === hotelName);
  if (!hotel) {
    hotel = {
      hotelId: generateId('H', hotels, 'hotelId'),
      hotelName
    };
    hotels.push(hotel);
  }
  return hotel.hotelId;
}

// Helper to get or create room
function getOrCreateRoom(hotelId, floor, roomNumber) {
  let room = rooms.find(r => r.hotelId === hotelId && r.floor === floor && r.roomNumber === roomNumber);
  if (!room) {
    room = {
      roomId: generateId('R', rooms, 'roomId'),
      hotelId,
      floor: floor.toString(),
      roomNumber: roomNumber.toString()
    };
    rooms.push(room);
  }
  return room.roomId;
}

// 3. Migrate Hotel Allocations
oldHotels.forEach(h => {
  const passenger = passengers.find(p => p.mobile === h.mobile);
  if (!passenger) return;
  
  const hotelId = getOrCreateHotel(h.hotelName);
  const roomId = getOrCreateRoom(hotelId, h.floor, h.room);
  
  hotelAllocations.push({
    hotelAllocationId: generateId('HA', hotelAllocations, 'hotelAllocationId'),
    passengerId: passenger.passengerId,
    hotelId,
    roomId,
    day: h.day.toString(),
    date: h.date || ""
  });
});

// Write new files
fs.writeFileSync(path.join(dataDir, 'passengers.json'), JSON.stringify(passengers, null, 2));
fs.writeFileSync(path.join(dataDir, 'families.json'), JSON.stringify(families, null, 2));
fs.writeFileSync(path.join(dataDir, 'trains.json'), JSON.stringify(trains, null, 2));
fs.writeFileSync(path.join(dataDir, 'coaches.json'), JSON.stringify(coaches, null, 2));
fs.writeFileSync(path.join(dataDir, 'train_allocations.json'), JSON.stringify(trainAllocations, null, 2));
fs.writeFileSync(path.join(dataDir, 'hotels.json'), JSON.stringify(hotels, null, 2));
fs.writeFileSync(path.join(dataDir, 'rooms.json'), JSON.stringify(rooms, null, 2));
fs.writeFileSync(path.join(dataDir, 'hotel_allocations.json'), JSON.stringify(hotelAllocations, null, 2));

console.log('Migration completed successfully!');
