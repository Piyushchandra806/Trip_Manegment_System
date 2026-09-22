import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function PUT(request, { params }) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { date, hotelName, roomNumber, floor } = await request.json();
    const day = parseInt((await params).day, 10);

    const { db } = await connectToDatabase();
    const passenger = await db.collection("passengers").findOne({ passengerId: (await params).id });
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

    // Upsert Room
    let room = await db.collection("rooms").findOne({ hotelId: hotel.hotelId, roomNumber });
    if (!room) {
      const count = await db.collection("rooms").countDocuments();
      room = { roomId: `R${String(count+1).padStart(6, "0")}`, hotelId: hotel.hotelId, roomNumber, floor: floor || "", createdAt: new Date().toISOString() };
      await db.collection("rooms").insertOne(room);
    }

    await db.collection("hotelAllocations").updateOne(
      { passengerId: passenger.passengerId, day },
      { $set: { hotelId: hotel.hotelId, roomId: room.roomId, date, updatedAt: new Date().toISOString() } }
    );

    await db.collection("activityLogs").insertOne({
      action: "Hotel allocation updated",
      
      details: `Updated hotel allocation for passenger ${passenger.passengerId} on day ${day}`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const day = parseInt((await params).day, 10);

    const { db } = await connectToDatabase();
    const passenger = await db.collection("passengers").findOne({ passengerId: (await params).id });
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found or access denied" }, { status: 404 });
    }

    await db.collection("hotelAllocations").deleteOne({ passengerId: passenger.passengerId, day });

    await db.collection("activityLogs").insertOne({
      action: "Hotel allocation deleted",
      
      details: `Deleted hotel allocation for passenger ${passenger.passengerId} on day ${day}`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
