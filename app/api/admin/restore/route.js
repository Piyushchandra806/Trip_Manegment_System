import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function POST(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { backupData } = await request.json();
    if (!backupData || !backupData.data) {
      return NextResponse.json({ error: "Invalid backup format" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const { passengers, families, trainAllocations, hotelAllocations } = backupData.data;

    // Delete existing admin-scoped data
    await db.collection("passengers").deleteMany({});
    await db.collection("families").deleteMany({});
    
    const passengerIds = passengers.map(p => p.passengerId);
    if (passengerIds.length > 0) {
      await db.collection("trainAllocations").deleteMany({ passengerId: { $in: passengerIds } });
      await db.collection("hotelAllocations").deleteMany({ passengerId: { $in: passengerIds } });
    }

    // Insert new data (making sure adminId is correct)
    if (families && families.length > 0) {
      const fixedFamilies = families.map(f => { delete f._id;  return f; });
      await db.collection("families").insertMany(fixedFamilies);
    }
    
    if (passengers && passengers.length > 0) {
      const fixedPassengers = passengers.map(p => { delete p._id;  return p; });
      await db.collection("passengers").insertMany(fixedPassengers);
    }

    if (trainAllocations && trainAllocations.length > 0) {
      const fixedTA = trainAllocations.map(ta => { delete ta._id; return ta; });
      await db.collection("trainAllocations").insertMany(fixedTA);
    }

    if (hotelAllocations && hotelAllocations.length > 0) {
      const fixedHA = hotelAllocations.map(ha => { delete ha._id; return ha; });
      await db.collection("hotelAllocations").insertMany(fixedHA);
    }

    await db.collection("activityLogs").insertOne({
      action: "Restore Data",
      
      details: "Restored data from backup",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Restore error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
