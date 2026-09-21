import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/data';

export async function PUT(request) {
  const { mobile, newFamilyId, newFamilyName } = await request.json();

  const passengers = await readJson('passengers.json');
  const index = passengers.findIndex(p => p.mobile === mobile);
  
  if (index === -1) {
    return NextResponse.json({ success: false, error: 'Passenger not found' }, { status: 404 });
  }

  passengers[index].familyId = newFamilyId;
  await writeJson('passengers.json', passengers);
  
  return NextResponse.json({ success: true });
}
