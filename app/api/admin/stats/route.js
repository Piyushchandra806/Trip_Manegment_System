import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    const passengerCount = await db.collection("passengers").countDocuments({ adminId: admin.adminId });
    const familyCount = await db.collection("families").countDocuments({ adminId: admin.adminId });
    
    // Use aggregation to count train allocations without pulling all passenger IDs into Node.js
    const trainResult = await db.collection("passengers").aggregate([
      { $match: { adminId: admin.adminId } },
      { $lookup: { from: "trainAllocations", localField: "passengerId", foreignField: "passengerId", as: "trains" } },
      { $match: { "trains.0": { $exists: true } } },
      { $count: "count" }
    ]).toArray();
    const trainAllocCount = trainResult.length > 0 ? trainResult[0].count : 0;

    // Use aggregation to count unique passengers with hotel allocations
    const hotelResult = await db.collection("passengers").aggregate([
      { $match: { adminId: admin.adminId } },
      { $lookup: { from: "hotelAllocations", localField: "passengerId", foreignField: "passengerId", as: "hotels" } },
      { $match: { "hotels.0": { $exists: true } } },
      { $count: "count" }
    ]).toArray();
    const hotelAllocCount = hotelResult.length > 0 ? hotelResult[0].count : 0;

    // Missing info (e.g. no train or no hotel)
    const missingTrain = passengerCount - trainAllocCount;
    const missingHotel = passengerCount - hotelAllocCount;

    return NextResponse.json({
      totalPassengers: passengerCount,
      totalFamilies: familyCount,
      passengersWithTrain: trainAllocCount,
      passengersWithHotel: passengerCount - missingHotel,
      missingInfo: missingTrain + missingHotel
    });
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
