import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request, { params }) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    // Admin scoping
    const passenger = await db.collection("passengers").findOne({ mobile: (await params).mobile, adminId: admin.adminId });
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found or access denied" }, { status: 404 });
    }

    let familyName = "Unknown";
    if (passenger.familyId) {
      const family = await db.collection("families").findOne({ familyId: passenger.familyId });
      if (family) familyName = family.familyName;
    }

    // Mask Aadhaar for Admin UI (as requested, or maybe they need to edit it? Assuming they can edit but we mask it for GET)
    // Wait, if they need to edit, we should send the real one. The prompt says "Prefer displaying XXXX XXXX 9012 instead of full number".
    // I will send the real one so the edit form works, the frontend can mask it in the table.
    // Actually the prompt says "Prefer displaying XXXX XXXX 9012... Never put Aadhaar in URLs, Public APIs. Admin side: Only authenticated admins can access Aadhaar."
    // Since this is an admin API and they might need to edit it, we return the real one here.
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
    
    const { mobile } = await params;
    console.log("PUT request details:", { mobile, adminId: admin.adminId, newMobile, paramsMobile: params.mobile });
    
    const passenger = await db.collection("passengers").findOne({ mobile: mobile, adminId: admin.adminId });
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found or access denied" }, { status: 404 });
    }

    // If mobile changed, check if new mobile exists
    if (mobile !== newMobile) {
      const existing = await db.collection("passengers").findOne({ mobile: newMobile });
      if (existing) {
        return NextResponse.json({ error: "New mobile number already exists" }, { status: 400 });
      }
    }

    await db.collection("passengers").updateOne(
      { passengerId: passenger.passengerId },
      { $set: { name, mobile: newMobile, aadhaarNumber, relativeName, age, address, gender, updatedAt: new Date().toISOString() } }
    );

    await db.collection("activityLogs").insertOne({
      action: "Passenger edited",
      adminId: admin.adminId,
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
    const passenger = await db.collection("passengers").findOne({ mobile: (await params).mobile, adminId: admin.adminId });
    
    if (!passenger) {
      return NextResponse.json({ error: "Passenger not found or access denied" }, { status: 404 });
    }

    await db.collection("passengers").deleteOne({ passengerId: passenger.passengerId });
    await db.collection("trainAllocations").deleteMany({ passengerId: passenger.passengerId });
    await db.collection("hotelAllocations").deleteMany({ passengerId: passenger.passengerId });

    await db.collection("activityLogs").insertOne({
      action: "Passenger deleted",
      adminId: admin.adminId,
      details: `Deleted passenger ${passenger.passengerId}`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
