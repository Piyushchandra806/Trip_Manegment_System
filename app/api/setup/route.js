import { NextResponse } from 'next/server';
import { createAdmin, hasAnyAdmins } from '@/lib/adminAuth';
import { verifySession } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Invalid input. Password must be at least 8 characters.' }, { status: 400 });
    }

    // Security Check: If any admins exist, require auth to create more
    const systemHasAdmins = await hasAnyAdmins();
    if (systemHasAdmins) {
      const token = request.cookies.get('admin_token')?.value;
      if (!token) {
        return NextResponse.json({ success: false, error: 'Unauthorized. Setup is locked after first admin is created.' }, { status: 401 });
      }
      const payload = await verifySession(token);
      if (!payload) {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    }

    // Centralized createAdmin logic (checks duplicates, hashes, saves)
    await createAdmin(username, password);

    // If it reaches here without throwing, persistence was 100% successful!
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Setup error:', err);
    // Return specific error message for duplicates or missing tokens
    if (err.message.includes('Username already exists')) {
      return NextResponse.json({ success: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Server error. Failed to save to persistent storage.' }, { status: 500 });
  }
}
