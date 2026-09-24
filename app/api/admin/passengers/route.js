import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";
import { getCachedArray } from "@/lib/staticCache";

export async function GET(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    const passengers = await db.collection("passengers").find({}).maxTimeMS(15000).toArray();
    const passengerIds = passengers.map(p => p.passengerId);
    
    const families = await db.collection("families").find({}).maxTimeMS(15000).toArray();
    const trainAllocations = await db.collection("trainAllocations").find({ passengerId: { $in: passengerIds } }).maxTimeMS(15000).toArray();
    const hotelAllocations = await db.collection("hotelAllocations").find({ passengerId: { $in: passengerIds } }).maxTimeMS(15000).toArray();
    const trains = await getCachedArray(db, "trains");
    const hotels = await getCachedArray(db, "hotels");
    const rooms = await getCachedArray(db, "rooms");
    const adminsList = await db.collection("admins").find({}).maxTimeMS(15000).toArray();

    const enriched = passengers.map(p => {
      const fam = families.find(f => f.familyId === p.familyId);
      const adminObj = adminsList.find(a => a.adminId === p.adminId);
      
      const ta = trainAllocations.find(a => a.passengerId === p.passengerId);
      let trainInfo = null;
      if (ta) {
        const t = trains.find(t => t.trainId === ta.trainId);
        trainInfo = {
          mobile: p.mobile,
          coach: ta.coachNumber || ta.coach || "",
          berth: ta.berthNumber || ta.berth || "",
          berthType: ta.berthType,
          trainName: t ? t.trainName : "",
          trainNumber: t ? t.trainNumber : ""
        };
      }

      const ha = hotelAllocations.filter(a => a.passengerId === p.passengerId);
      const hotelsInfo = ha.map(a => {
        const h = hotels.find(h => h.hotelId === a.hotelId);
        const r = rooms.find(r => r.roomId === a.roomId);
        return {
          mobile: p.mobile,
          day: parseInt(a.day, 10),
          date: a.date,
          hotelName: h ? h.hotelName : "",
          floor: r ? r.floor : "",
          room: r ? r.roomNumber : ""
        };
      });

      const maskedAadhaar = p.aadhaarNumber ? `XXXX XXXX ${p.aadhaarNumber.slice(-4)}` : "";

      return {
        ...p,
        relativeName: p.relationName || p.relativeName || "",
        aadhaarNumber: maskedAadhaar,
        familyName: fam ? fam.familyName : (p.mobile ? `Family (${p.mobile})` : "Unknown"),
        adminName: adminObj ? adminObj.username : "All",
        train: trainInfo,
        hotels: hotelsInfo
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
