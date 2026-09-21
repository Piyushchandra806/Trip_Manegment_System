import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    // Only return families assigned to this admin
    const rawFamilies = await db.collection("families").find({ adminId: admin.adminId }).toArray();
    
    // To count members, we just query passengers for this admin
    const passengers = await db.collection("passengers").find({ adminId: admin.adminId }).toArray();

    const families = rawFamilies.map(f => {
      const members = passengers.filter(p => p.familyId === f.familyId);
      return {
        ...f,
        memberCount: members.length,
        members: members
      };
    });

    return NextResponse.json(families);
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
