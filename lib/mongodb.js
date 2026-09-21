import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV) {
    console.warn('MONGODB_URI is missing. Please add it to your environment variables.');
  }
}

let client;
let clientPromise;

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global;
    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

export default clientPromise;

export async function connectToDatabase() {
  if (!clientPromise) {
    throw new Error('MONGODB_URI is not defined. Cannot connect to database.');
  }
  const connectedClient = await clientPromise;
  const db = connectedClient.db(); 
  return { client: connectedClient, db };
}
