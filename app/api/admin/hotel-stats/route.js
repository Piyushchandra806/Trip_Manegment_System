import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    const passengers = await db.collection("passengers").find({}).toArray();
    const pIds = passengers.map(p => p.passengerId);

    const allocs = await db.collection("hotelAllocations").find({ passengerId: { $in: pIds } }).toArray();
    const hotels = await db.collection("hotels").find({}).toArray();

    // Calculate occupied rooms per hotel based ONLY on this admin"s passengers
    const stats = hotels.map(h => {
      const hotelAllocs = allocs.filter(a => a.hotelId === h.hotelId);
      // Group by room to find unique rooms occupied
      const uniqueRooms = new Set(hotelAllocs.map(a => a.roomId)).size;
      return {
        hotelName: h.hotelName,
        occupiedRooms: uniqueRooms,
        totalGuests: new Set(hotelAllocs.map(a => a.passengerId)).size
      };
    });

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
