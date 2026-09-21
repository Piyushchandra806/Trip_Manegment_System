import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/data';
import { generateId } from '@/lib/idUtils';
import { logActivity } from '@/lib/activity';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

// Helper to auto-backup before import
async function autoBackup() {
  const dataDir = path.join(process.cwd(), 'data');
  const backupsDir = path.join(dataDir, 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

  const zip = new AdmZip();
  const files = fs.readdirSync(dataDir);
  for (const f of files) {
    if (f.endsWith('.json')) {
      zip.addLocalFile(path.join(dataDir, f));
    }
  }
  zip.writeZip(path.join(backupsDir, `auto-backup-before-import-${Date.now()}.zip`));
}

export async function POST(request) {
  try {
    const { records, actionType } = await request.json();
    
    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ success: true, imported: 0 });
    }

    // Auto-backup before large operation
    await autoBackup();

    const passengers = (await readJson('passengers.json')).filter(r => !r.isDemo);
    const families = (await readJson('families.json')).filter(r => !r.isDemo);
    const trains = (await readJson('trains.json')).filter(r => !r.isDemo);
    const coaches = (await readJson('coaches.json')).filter(r => !r.isDemo);
    const trainAllocations = (await readJson('train_allocations.json')).filter(r => !r.isDemo);
    const hotels = (await readJson('hotels.json')).filter(r => !r.isDemo);
    const rooms = (await readJson('rooms.json')).filter(r => !r.isDemo);
    const hotelAllocations = (await readJson('hotel_allocations.json')).filter(r => !r.isDemo);
    
    const history = await readJson('import_history.json');

    let importedCount = 0;

    for (const record of records) {
      if (!record.mobile) continue; // Mobile is required
      
      const mobile = String(record.mobile).substring(0, 15);
      const name = String(record.name || 'Unknown').substring(0, 100);
      
      // Family handling
      let familyId = null;
      if (record.family) {
        const familyName = String(record.family).substring(0, 100);
        let family = families.find(f => f.familyName === familyName);
        if (!family) {
          family = { familyId: generateId('F', families, 'familyId'), familyName };
          families.push(family);
        }
        familyId = family.familyId;
      }

      // Passenger handling
      let passenger = passengers.find(p => p.mobile === mobile);
      if (passenger) {
        if (record.duplicateAction === 'skip') continue;
        // Update
        
        if (record.name) passenger.name = name;
        if (familyId) passenger.familyId = familyId;
        if (record.aadhaarNumber) {
           const cleanedAadhaar = String(record.aadhaarNumber).replace(/\s+/g, '');
           if (/^\d{12}$/.test(cleanedAadhaar)) {
             passenger.aadhaarNumber = cleanedAadhaar;
           }
        }

      } else {
        // Create
        
        passenger = {
          passengerId: generateId('P', passengers, 'passengerId'),
          name,
          mobile,
          familyId: familyId || 'F000000'
        };
        if (record.aadhaarNumber) {
           const cleanedAadhaar = String(record.aadhaarNumber).replace(/\s+/g, '');
           if (/^\d{12}$/.test(cleanedAadhaar)) {
             passenger.aadhaarNumber = cleanedAadhaar;
           }
        }
        passengers.push(passenger);

      }
      
      importedCount++;

      // Train handling
      if (record.coach && record.berth) {
        const coachNumber = String(record.coach).substring(0, 20);
        const berthNumber = String(record.berth).substring(0, 10);
        
        let train = trains.find(t => t.trainName === "Imported Train");
        if (!train) {
          train = { trainId: generateId('T', trains, 'trainId'), trainName: "Imported Train", trainNumber: "00000" };
          trains.push(train);
        }
        
        let coachObj = coaches.find(c => c.trainId === train.trainId && c.coachNumber === coachNumber);
        if (!coachObj) {
          coachObj = { coachId: generateId('C', coaches, 'coachId'), trainId: train.trainId, coachNumber, coachType: "Sleeper" };
          coaches.push(coachObj);
        }
        
        const allocIndex = trainAllocations.findIndex(a => a.passengerId === passenger.passengerId);
        if (allocIndex !== -1) {
          trainAllocations[allocIndex].coachId = coachObj.coachId;
          trainAllocations[allocIndex].coachNumber = coachNumber;
          trainAllocations[allocIndex].berthNumber = berthNumber;
        } else {
          trainAllocations.push({
            allocationId: generateId('A', trainAllocations, 'allocationId'),
            passengerId: passenger.passengerId,
            trainId: train.trainId,
            coachId: coachObj.coachId,
            coachNumber,
            berthNumber,
            berthType: String(record.berthType || "Unknown").substring(0, 20)
          });
        }
      }

      // Hotel handling
      if (record.hotel && record.room) {
        const hotelName = String(record.hotel).substring(0, 100);
        const roomNumber = String(record.room).substring(0, 20);

        let hotelObj = hotels.find(h => h.hotelName === hotelName);
        if (!hotelObj) {
          hotelObj = { hotelId: generateId('H', hotels, 'hotelId'), hotelName };
          hotels.push(hotelObj);
        }

        let roomObj = rooms.find(r => r.hotelId === hotelObj.hotelId && r.roomNumber === roomNumber);
        if (!roomObj) {
          roomObj = { 
            roomId: generateId('R', rooms, 'roomId'), 
            hotelId: hotelObj.hotelId, 
            floor: String(record.floor || "1").substring(0, 10), 
            roomNumber 
          };
          rooms.push(roomObj);
        }

        const day = String(record.day || "1").substring(0, 10);
        const haIndex = hotelAllocations.findIndex(ha => ha.passengerId === passenger.passengerId && ha.day === day);
        if (haIndex !== -1) {
          hotelAllocations[haIndex].hotelId = hotelObj.hotelId;
          hotelAllocations[haIndex].roomId = roomObj.roomId;
        } else {
          hotelAllocations.push({
            hotelAllocationId: generateId('HA', hotelAllocations, 'hotelAllocationId'),
            passengerId: passenger.passengerId,
            hotelId: hotelObj.hotelId,
            roomId: roomObj.roomId,
            day: day,
            date: ""
          });
        }
      }
    }

    // Save all tables
    await writeJson('families.json', families);
    await writeJson('passengers.json', passengers);
    await writeJson('trains.json', trains);
    await writeJson('coaches.json', coaches);
    await writeJson('train_allocations.json', trainAllocations);
    await writeJson('hotels.json', hotels);
    await writeJson('rooms.json', rooms);
    await writeJson('hotel_allocations.json', hotelAllocations);

    // Add history
    history.unshift({
      filename: actionType + " Import",
      count: importedCount,
      timestamp: new Date().toISOString()
    });
    
    if (history.length > 10) history.length = 10;
    await writeJson('import_history.json', history);

    await logActivity('Imported Data', `Successfully imported ${importedCount} records via ${actionType || 'upload'}`);

    return NextResponse.json({ success: true, imported: importedCount });
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json({ success: false, error: 'We couldn\'t complete this operation. Please try again.' }, { status: 500 });
  }
}
