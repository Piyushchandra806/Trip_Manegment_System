import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request, { params }) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const passenger = await db.collection("passengers").findOne({ mobile: params.mobile, adminId: admin.adminId });
    
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found or access denied" }, { status: 404 });
    }

    const allocs = await db.collection("hotelAllocations").find({ passengerId: passenger.passengerId }).toArray();
    const hotels = await db.collection("hotels").find({}).toArray();
    const rooms = await db.collection("rooms").find({}).toArray();

    const response = allocs.map(a => {
      const h = hotels.find(h => h.hotelId === a.hotelId);
      const r = rooms.find(r => r.roomId === a.roomId);
      return {
        hotelAllocationId: a.hotelAllocationId,
        day: a.day,
        date: a.date,
        hotelName: h ? h.hotelName : "",
        roomNumber: r ? r.roomNumber : "",
        floor: r ? r.floor : ""
      };
    });

    return NextResponse.json(response.sort((a, b) => a.day - b.day));
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { day, date, hotelName, roomNumber, floor } = await request.json();

    if (!day || !date || !hotelName || !roomNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const passenger = await db.collection("passengers").findOne({ mobile: params.mobile, adminId: admin.adminId });
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found or access denied" }, { status: 404 });
    }

    // Upsert Hotel
    let hotel = await db.collection("hotels").findOne({ hotelName });
    if (!hotel) {
      const count = await db.collection("hotels").countDocuments();
      hotel = { hotelId: `H${String(count+1).padStart(6, "0")}`, hotelName, createdAt: new Date().toISOString() };
      await db.collection("hotels").insertOne(hotel);
    }

    // Upsert Room (Not globally unique, scoped to hotel)
    let room = await db.collection("rooms").findOne({ hotelId: hotel.hotelId, roomNumber });
    if (!room) {
      const count = await db.collection("rooms").countDocuments();
      room = { roomId: `R${String(count+1).padStart(6, "0")}`, hotelId: hotel.hotelId, roomNumber, floor: floor || "", createdAt: new Date().toISOString() };
      await db.collection("rooms").insertOne(room);
    }

    const allocCount = await db.collection("hotelAllocations").countDocuments();
    const alloc = {
      hotelAllocationId: `HA${String(allocCount+1).padStart(6, "0")}`,
      passengerId: passenger.passengerId,
      hotelId: hotel.hotelId,
      roomId: room.roomId,
      day: parseInt(day, 10),
      date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection("hotelAllocations").insertOne(alloc);

    await db.collection("activityLogs").insertOne({
      action: "Hotel allocated",
      adminId: admin.adminId,
      details: `Allocated hotel to passenger ${passenger.passengerId} for day ${day}`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
