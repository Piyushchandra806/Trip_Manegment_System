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
  let globalWithMongo = global;
  if (!globalWithMongo._mongoClientPromise) {
    const options = {
      maxPoolSize: 10, // Prevent unbounded connection growth in serverless
      serverSelectionTimeoutMS: 5000, // Fail fast if DB is completely down
      connectTimeoutMS: 10000, // Reasonable connect timeout
      socketTimeoutMS: 45000, // Ensure long queries eventually time out
    };
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
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
