import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    // Fetch all admin-scoped data
    const passengers = await db.collection("passengers").find({ adminId: admin.adminId }).toArray();
    const families = await db.collection("families").find({ adminId: admin.adminId }).toArray();
    
    const passengerIds = passengers.map(p => p.passengerId);
    const trainAllocations = await db.collection("trainAllocations").find({ passengerId: { $in: passengerIds } }).toArray();
    const hotelAllocations = await db.collection("hotelAllocations").find({ passengerId: { $in: passengerIds } }).toArray();
    
    // Global tables (for completeness)
    const trains = await db.collection("trains").find({}).toArray();
    const coaches = await db.collection("coaches").find({}).toArray();
    const hotels = await db.collection("hotels").find({}).toArray();
    const rooms = await db.collection("rooms").find({}).toArray();

    const exportData = {
      timestamp: new Date().toISOString(),
      adminId: admin.adminId,
      data: {
        passengers,
        families,
        trainAllocations,
        hotelAllocations,
        trains,
        coaches,
        hotels,
        rooms
      }
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="trip-management-backup-${new Date().toISOString().split("T")[0]}.json"`
      }
    });
  } catch (err) {
    console.error("Backup error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
