const { MongoClient } = require('mongodb');

async function createIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is missing');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log('Creating index for admins.username...');
    await db.collection('admins').createIndex({ username: 1 }, { unique: true });

    console.log('Creating index for passengers.mobile...');
    await db.collection('passengers').createIndex({ mobile: 1 });

    console.log('Creating index for passengers.adminId...');
    await db.collection('passengers').createIndex({ adminId: 1 });

    console.log('Creating index for passengers.familyId...');
    await db.collection('passengers').createIndex({ familyId: 1 });

    console.log('Creating index for trainAllocations.passengerId...');
    await db.collection('trainAllocations').createIndex({ passengerId: 1 });

    console.log('Creating index for hotelAllocations.passengerId...');
    await db.collection('hotelAllocations').createIndex({ passengerId: 1 });

    console.log('All indexes created successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await client.close();
  }
}

createIndexes();
