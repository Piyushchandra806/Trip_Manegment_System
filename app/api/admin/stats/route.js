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
    
    // Find all passenger IDs for this admin to scope allocations
    const passengers = await db.collection("passengers").find({ adminId: admin.adminId }, { projection: { passengerId: 1 } }).toArray();
    const pIds = passengers.map(p => p.passengerId);

    const trainAllocCount = await db.collection("trainAllocations").countDocuments({ passengerId: { $in: pIds } });
    const hotelAllocCount = await db.collection("hotelAllocations").countDocuments({ passengerId: { $in: pIds } });

    // Missing info (e.g. no train or no hotel)
    const missingTrain = passengerCount - trainAllocCount;
    // (Hotel logic is complex if they need multiple days, we will just provide basic stats here)
    const missingHotel = passengerCount - await db.collection("hotelAllocations").distinct("passengerId", { passengerId: { $in: pIds } }).then(ids => ids.length);

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
