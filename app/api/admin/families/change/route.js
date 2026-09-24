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

    // Target family ID is now the target Mobile Number
    const targetMobile = targetFamilyId;

    // Assign passenger to new "family" (which means updating their mobile number)
    await db.collection("passengers").updateOne(
      { passengerId: passenger.passengerId },
      { $set: { mobile: targetMobile, updatedAt: new Date().toISOString() } }
    );

    await db.collection("activityLogs").insertOne({
      action: "Family assignment changed",
      details: `Passenger ${passenger.passengerId} moved to mobile/family ${targetMobile}`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
