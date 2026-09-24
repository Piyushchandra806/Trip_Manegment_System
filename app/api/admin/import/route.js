import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function POST(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { records, actionType } = await request.json();
    
    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ success: true, imported: 0 });
    }

    const { db } = await connectToDatabase();
    
    let importedCount = 0;

    for (const record of records) {
      if (!record.mobile) continue; // Mobile is required
      
      const mobile = String(record.mobile).substring(0, 15);
      const name = String(record.name || "Unknown").substring(0, 100);
      
      let familyId = null;
      if (record.family) {
        const familyName = String(record.family).substring(0, 100);
        let family = await db.collection("families").findOne({ familyName });
        if (!family) {
          const c = await db.collection("families").countDocuments();
          familyId = `F${String(c+1).padStart(6, "0")}`;
          await db.collection("families").insertOne({ familyId, familyName, createdAt: new Date().toISOString() });
        } else {
          familyId = family.familyId;
        }
      }

      let passenger = await db.collection("passengers").findOne({ mobile });
      let pId = null;

      let validAadhaar = null;
      if (record.aadhaarNumber) {
        const cleanedAadhaar = String(record.aadhaarNumber).replace(/\s+/g, "");
        if (/^\d{12}$/.test(cleanedAadhaar)) {
          validAadhaar = cleanedAadhaar;
        }
      }

      if (passenger) {
        if (record.duplicateAction === "skip") continue;
        
        pId = passenger.passengerId;
        const updates = { updatedAt: new Date().toISOString() };
        if (record.name) updates.name = name;
        if (familyId) updates.familyId = familyId;
        if (validAadhaar) updates.aadhaarNumber = validAadhaar;
        
        await db.collection("passengers").updateOne({ passengerId: pId }, { $set: updates });
      } else {
        const c = await db.collection("passengers").countDocuments();
        pId = `P${String(c+1).padStart(6, "0")}`;
        await db.collection("passengers").insertOne({
          passengerId: pId,
          
          name,
          mobile,
          familyId: familyId || "F000000",
          aadhaarNumber: validAadhaar || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      importedCount++;

      // Train handling
      if (record.coach && record.berth) {
        const coachNumber = String(record.coach).substring(0, 20);
        const berthNumber = String(record.berth).substring(0, 10);
        
        let train = await db.collection("trains").findOne({ trainName: "Imported Train" });
        if (!train) {
          const c = await db.collection("trains").countDocuments();
          train = { trainId: `T${String(c+1).padStart(6, "0")}`, trainName: "Imported Train", trainNumber: "00000", createdAt: new Date().toISOString() };
          await db.collection("trains").insertOne(train);
        }
        
        let coachObj = await db.collection("coaches").findOne({ trainId: train.trainId, coachNumber });
        if (!coachObj) {
          const c = await db.collection("coaches").countDocuments();
          coachObj = { coachId: `C${String(c+1).padStart(6, "0")}`, trainId: train.trainId, coachNumber, coachType: "Sleeper", createdAt: new Date().toISOString() };
          await db.collection("coaches").insertOne(coachObj);
        }
        
        const existingAlloc = await db.collection("trainAllocations").findOne({ passengerId: pId });
        if (existingAlloc) {
          await db.collection("trainAllocations").updateOne(
            { passengerId: pId },
            { $set: { trainId: train.trainId, coachId: coachObj.coachId, coachNumber, berthNumber, updatedAt: new Date().toISOString() } }
          );
        } else {
          const c = await db.collection("trainAllocations").countDocuments();
          await db.collection("trainAllocations").insertOne({
            allocationId: `TA${String(c+1).padStart(6, "0")}`,
            passengerId: pId,
            trainId: train.trainId,
            coachId: coachObj.coachId,
            coachNumber,
            berthNumber,
            berthType: String(record.berthType || "Unknown").substring(0, 20),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Hotel handling
      if (record.hotel && record.room) {
        const hotelName = String(record.hotel).substring(0, 100);
        const roomNumber = String(record.room).substring(0, 20);

        let hotelObj = await db.collection("hotels").findOne({ hotelName });
        if (!hotelObj) {
          const c = await db.collection("hotels").countDocuments();
          hotelObj = { hotelId: `H${String(c+1).padStart(6, "0")}`, hotelName, createdAt: new Date().toISOString() };
          await db.collection("hotels").insertOne(hotelObj);
        }

        let roomObj = await db.collection("rooms").findOne({ hotelId: hotelObj.hotelId, roomNumber });
        if (!roomObj) {
          const c = await db.collection("rooms").countDocuments();
          roomObj = { 
            roomId: `R${String(c+1).padStart(6, "0")}`, 
            hotelId: hotelObj.hotelId, 
            floor: String(record.floor || "1").substring(0, 10), 
            roomNumber,
            createdAt: new Date().toISOString() 
          };
          await db.collection("rooms").insertOne(roomObj);
        }

        const day = parseInt(record.day || "1", 10);
        const existingHa = await db.collection("hotelAllocations").findOne({ passengerId: pId, day });
        
        if (existingHa) {
          await db.collection("hotelAllocations").updateOne(
            { passengerId: pId, day },
            { $set: { hotelId: hotelObj.hotelId, roomId: roomObj.roomId, updatedAt: new Date().toISOString() } }
          );
        } else {
          const c = await db.collection("hotelAllocations").countDocuments();
          await db.collection("hotelAllocations").insertOne({
            hotelAllocationId: `HA${String(c+1).padStart(6, "0")}`,
            passengerId: pId,
            hotelId: hotelObj.hotelId,
            roomId: roomObj.roomId,
            day: day,
            date: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    // Add import history
    await db.collection("importHistory").insertOne({
      
      filename: actionType + " Import",
      count: importedCount,
      timestamp: new Date().toISOString()
    });

    if (importedCount > 0) {
      const { invalidateCache } = await import("@/lib/staticCache");
      invalidateCache("trains");
      invalidateCache("hotels");
      invalidateCache("rooms");
    }

    await db.collection("activityLogs").insertOne({
      action: "Imported Data",
      
      details: `Successfully imported ${importedCount} records via ${actionType || "upload"}`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, imported: importedCount });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ success: false, error: "We couldn't complete this operation." }, { status: 500 });
  }
}
