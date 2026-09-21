import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    const passengers = await db.collection("passengers").find({ adminId: admin.adminId }).toArray();
    const pIds = passengers.map(p => p.passengerId);

    const allocs = await db.collection("trainAllocations").find({ passengerId: { $in: pIds } }).toArray();
    const trains = await db.collection("trains").find({}).toArray();

    const stats = trains.map(t => {
      const trainAllocs = allocs.filter(a => a.trainId === t.trainId);
      return {
        trainName: t.trainName,
        trainNumber: t.trainNumber,
        totalPassengers: trainAllocs.length
      };
    });

    // Only return trains that actually have passengers for this admin
    return NextResponse.json(stats.filter(s => s.totalPassengers > 0));
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
