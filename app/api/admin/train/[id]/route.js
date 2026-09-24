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

    const alloc = await db.collection("trainAllocations").findOne({ passengerId: passenger.passengerId });
    if (!alloc) return NextResponse.json(null);

    const train = await db.collection("trains").findOne({ trainId: alloc.trainId });
    return NextResponse.json({
      trainName: train ? train.trainName : "",
      trainNumber: train ? train.trainNumber : "",
      coachNumber: alloc.coach || alloc.coachNumber,
      berthNumber: alloc.berth || alloc.berthNumber,
      berthType: alloc.berthType
    });
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { trainName, trainNumber, coachNumber, berthNumber, berthType } = await request.json();

    if (!trainName || !coachNumber || !berthNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const passenger = await db.collection("passengers").findOne({ passengerId: (await params).id });
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found or access denied" }, { status: 404 });
    }

    // Upsert Train
    let train = await db.collection("trains").findOne({ trainName, trainNumber: trainNumber || "" });
    if (!train) {
      const count = await db.collection("trains").countDocuments();
      train = { trainId: `T${String(count+1).padStart(6, "0")}`, trainName, trainNumber: trainNumber || "", createdAt: new Date().toISOString() };
      await db.collection("trains").insertOne(train);
      
      const { invalidateCache } = await import("@/lib/staticCache");
      invalidateCache("trains");
    }

    // Upsert Coach
    let coach = await db.collection("coaches").findOne({ trainId: train.trainId, coachNumber });
    if (!coach) {
      const count = await db.collection("coaches").countDocuments();
      coach = { coachId: `C${String(count+1).padStart(6, "0")}`, trainId: train.trainId, coachNumber, coachType: "", createdAt: new Date().toISOString() };
      await db.collection("coaches").insertOne(coach);
    }

    const existingAlloc = await db.collection("trainAllocations").findOne({ passengerId: passenger.passengerId });
    if (existingAlloc) {
      await db.collection("trainAllocations").updateOne(
        { passengerId: passenger.passengerId },
        { $set: { trainId: train.trainId, coachId: coach.coachId, coachNumber, berthNumber, berthType, updatedAt: new Date().toISOString() } }
      );
    } else {
      const count = await db.collection("trainAllocations").countDocuments();
      await db.collection("trainAllocations").insertOne({
        allocationId: `TA${String(count+1).padStart(6, "0")}`,
        passengerId: passenger.passengerId,
        trainId: train.trainId,
        coachId: coach.coachId,
        coachNumber,
        berthNumber,
        berthType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    await db.collection("activityLogs").insertOne({
      action: "Train allocation updated",
      
      details: `Updated train allocation for passenger ${passenger.passengerId}`,
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

    await db.collection("trainAllocations").deleteOne({ passengerId: passenger.passengerId });

    await db.collection("activityLogs").insertOne({
      action: "Train allocation deleted",
      
      details: `Deleted train allocation for passenger ${passenger.passengerId}`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
