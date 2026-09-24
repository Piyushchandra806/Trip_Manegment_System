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
    
    const families = await db.collection("families").find({}).toArray();
    
    const allocs = await db.collection("trainAllocations").find({ passengerId: { $in: pIds } }).toArray();

    const mobileToFamilyName = {};
    for (const p of passengers) {
      if (p.mobile && !mobileToFamilyName[p.mobile]) {
        mobileToFamilyName[p.mobile] = `${p.name ? p.name.split(' ')[0] : 'Unknown'} & Family (${p.mobile})`;
      }
    }

    const coachesMap = {};
    for (const alloc of allocs) {
      const p = passengers.find(x => x.passengerId === alloc.passengerId);
      if (!p) continue;
      
      const c = alloc.coach || alloc.coachNumber || "Unknown";
      if (!coachesMap[c]) {
        coachesMap[c] = {
          coach: c,
          passengers: []
        };
      }
      
      const fam = families.find(f => f.familyId === p.familyId);
      
      coachesMap[c].passengers.push({
        berth: alloc.berth || alloc.berthNumber || "Unknown",
        name: p.name,
        mobile: p.mobile,
        familyName: fam ? fam.familyName : (p.mobile ? mobileToFamilyName[p.mobile] : "Unknown")
      });
    }
    
    return NextResponse.json(Object.values(coachesMap));
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
