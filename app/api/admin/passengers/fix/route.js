import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function POST(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { updates } = body; 
    
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates array required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    let count = 0;
    for (const update of updates) {
      const { oldMobile, name, mobile, aadhaarNumber } = update;
      // Only allow updating passengers belonging to this admin
      const passenger = await db.collection("passengers").findOne({ mobile: oldMobile, adminId: admin.adminId });
      if (passenger) {
        await db.collection("passengers").updateOne(
          { passengerId: passenger.passengerId },
          { $set: { name, mobile: mobile || oldMobile, aadhaarNumber, updatedAt: new Date().toISOString() } }
        );
        count++;
      }
    }

    await db.collection("activityLogs").insertOne({
      action: "Bulk Passenger edited",
      adminId: admin.adminId,
      details: `Bulk edited ${count} passengers`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
