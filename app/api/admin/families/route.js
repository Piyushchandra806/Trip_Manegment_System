import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    const passengers = await db.collection("passengers").find({}).toArray();

    // Group passengers by mobile number
    const groupedByMobile = {};
    for (const p of passengers) {
      const mobile = p.mobile || "Unknown";
      if (!groupedByMobile[mobile]) {
        groupedByMobile[mobile] = [];
      }
      groupedByMobile[mobile].push(p);
    }

    const families = Object.keys(groupedByMobile).map(mobile => {
      const members = groupedByMobile[mobile];
      // Use the first member's name as the family name prefix
      const familyName = members[0].name.split(' ')[0]; 
      return {
        familyId: mobile, // Use mobile as the family ID for moving
        familyName: `${familyName} & Family (${mobile})`,
        memberCount: members.length,
        members: members
      };
    });

    return NextResponse.json(families);
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
