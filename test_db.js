const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("trip_management");
    
    const passenger = await db.collection("passengers").findOne({ mobile: "9424109855" });
    console.log("Passenger found:", passenger);
    
  } finally {
    await client.close();
  }
}
run().catch(console.error);
