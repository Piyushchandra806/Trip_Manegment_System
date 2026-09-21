import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    const passengers = await db.collection("passengers").find({ adminId: admin.adminId }).toArray();
    const pIds = passengers.map(p => p.passengerId);
    
    const families = await db.collection("families").find({ adminId: admin.adminId }).toArray();
    
    const allocs = await db.collection("trainAllocations").find({ passengerId: { $in: pIds } }).toArray();

    const coachesMap = {};
    for (const alloc of allocs) {
      const p = passengers.find(x => x.passengerId === alloc.passengerId);
      if (!p) continue;
      
      const c = alloc.coachNumber || "Unknown";
      if (!coachesMap[c]) {
        coachesMap[c] = {
          coach: c,
          passengers: []
        };
      }
      
      const fam = families.find(f => f.familyId === p.familyId);
      
      coachesMap[c].passengers.push({
        berth: alloc.berthNumber || "Unknown",
        name: p.name,
        mobile: p.mobile,
        familyName: fam ? fam.familyName : "Unknown"
      });
    }
    
    return NextResponse.json(Object.values(coachesMap));
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
