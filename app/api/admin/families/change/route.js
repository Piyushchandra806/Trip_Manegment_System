import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function POST(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { passengerId, targetFamilyId } = await request.json();

    if (!passengerId || !targetFamilyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Verify passenger belongs to admin
    const passenger = await db.collection("passengers").findOne({ passengerId: passengerId });
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found" }, { status: 404 });
    }

    // Verify target family belongs to admin
    const family = await db.collection("families").findOne({ familyId: targetFamilyId });
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Assign passenger to new family
    await db.collection("passengers").updateOne(
      { passengerId: passenger.passengerId },
      { $set: { familyId: targetFamilyId, updatedAt: new Date().toISOString() } }
    );

    await db.collection("activityLogs").insertOne({
      action: "Family assignment changed",
      
      details: `Passenger ${passenger.passengerId} moved to family ${targetFamilyId}`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
