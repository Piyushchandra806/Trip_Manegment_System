import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request, { params }) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    const passenger = await db.collection("passengers").findOne({ passengerId: (await params).id });
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found or access denied" }, { status: 404 });
    }

    let familyName = "Unknown";
    if (passenger.familyId) {
      const family = await db.collection("families").findOne({ familyId: passenger.familyId });
      if (family) familyName = family.familyName;
    }

    return NextResponse.json({ ...passenger, familyName });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, aadhaarNumber, mobile: newMobile, relativeName, age, address, gender } = body;

    if (!name || !newMobile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const { id } = await params;
    
    const passenger = await db.collection("passengers").findOne({ passengerId: id });
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found or access denied" }, { status: 404 });
    }

    await db.collection("passengers").updateOne(
      { passengerId: passenger.passengerId },
      { $set: { name, mobile: newMobile, aadhaarNumber, relativeName, age, address, gender, updatedAt: new Date().toISOString() } }
    );

    await db.collection("activityLogs").insertOne({
      action: "Passenger edited",
      
      details: `Edited passenger ${passenger.passengerId}`,
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

    const { db } = await connectToDatabase();
    const passenger = await db.collection("passengers").findOne({ passengerId: (await params).id });
    
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found or access denied" }, { status: 404 });
    }

    await db.collection("passengers").deleteOne({ passengerId: passenger.passengerId });
    await db.collection("trainAllocations").deleteMany({ passengerId: passenger.passengerId });
    await db.collection("hotelAllocations").deleteMany({ passengerId: passenger.passengerId });

    await db.collection("activityLogs").insertOne({
      action: "Passenger deleted",
      
      details: `Deleted passenger ${passenger.passengerId}`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
