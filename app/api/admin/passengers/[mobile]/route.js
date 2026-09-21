import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/data';
import { generateId } from '@/lib/idUtils';
import { logActivity } from '@/lib/activity';

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const { mobile } = params;
    const { name, newMobile, familyName, aadhaarNumber } = await request.json();

    if (!mobile || !name || !familyName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (name.length > 100 || familyName.length > 100 || (newMobile && newMobile.length > 15)) {
      return NextResponse.json({ success: false, error: 'Input too long' }, { status: 400 });
    }

    const passengers = await readJson('passengers.json');
    const index = passengers.findIndex(p => p.mobile === mobile);
    
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Passenger not found' }, { status: 404 });
    }

    // Check for duplicate mobile
    if (newMobile && newMobile !== mobile) {
      const isDuplicate = passengers.some(p => p.mobile === newMobile);
      if (isDuplicate) {
        return NextResponse.json({ 
          success: false, 
          error: `⚠ Duplicate Mobile Number\n\n${newMobile} is already assigned to another passenger.\n\nPlease check the passenger information.`
        }, { status: 409 });
      }
    }

    // Handle Family
    const families = await readJson('families.json');
    let family = families.find(f => f.familyName === familyName);
    if (!family) {
      family = {
        familyId: generateId('F', families, 'familyId'),
        familyName
      };
      families.push(family);
      await writeJson('families.json', families);
    }

    
    // Update passenger details
    passengers[index].name = name;
    passengers[index].familyId = family.familyId;
    
    if (aadhaarNumber) {
      const cleanedAadhaar = String(aadhaarNumber).replace(/\s+/g, '');
      if (/^\d{12}$/.test(cleanedAadhaar)) {
        passengers[index].aadhaarNumber = cleanedAadhaar;
      } else {
        return NextResponse.json({ success: false, error: 'Aadhaar must be exactly 12 digits.' }, { status: 400 });
      }
    } else {
      passengers[index].aadhaarNumber = null;
    }

    
    if (newMobile && newMobile !== mobile) {
      passengers[index].mobile = newMobile;
    }
    
    await writeJson('passengers.json', passengers);
    await logActivity('Edited Passenger', `Updated details for ${name} (${newMobile || mobile})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'We couldn\'t complete this operation. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const { mobile } = params;

    const passengers = await readJson('passengers.json');
    const index = passengers.findIndex(p => p.mobile === mobile);
    
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Passenger not found' }, { status: 404 });
    }

    const passenger = passengers[index];

    // Remove from passengers
    passengers.splice(index, 1);
    await writeJson('passengers.json', passengers);

    // Remove train allocation
    const trainAlloc = await readJson('train_allocations.json');
    const newTrainAlloc = trainAlloc.filter(a => a.passengerId !== passenger.passengerId);
    await writeJson('train_allocations.json', newTrainAlloc);

    // Remove hotel allocation
    const hotelAlloc = await readJson('hotel_allocations.json');
    const newHotelAlloc = hotelAlloc.filter(a => a.passengerId !== passenger.passengerId);
    await writeJson('hotel_allocations.json', newHotelAlloc);

    await logActivity('Deleted Passenger', `Removed ${passenger.name} (${passenger.mobile}) and their allocations`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'We couldn\'t complete this operation. Please try again.' }, { status: 500 });
  }
}
