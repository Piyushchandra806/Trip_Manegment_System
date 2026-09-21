import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/data';
import { hashPassword } from '@/lib/crypto';
import { verifySession } from '@/lib/auth';

function generateAdminId(admins) {
  const nums = admins.map(a => parseInt(a.adminId.replace('AD', '')) || 0);
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return 'AD' + String(max + 1).padStart(6, '0');
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length === 0) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    const admins = await readJson('admins.json');

    // Security Check: If admins exist, require auth
    if (admins.length > 0) {
      const token = request.cookies.get('admin_token')?.value;
      if (!token) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const payload = await verifySession(token);
      if (!payload) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Check duplicate username
    if (admins.some(a => a.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Username already exists. Please choose another username.' }, { status: 409 });
    }

    const newAdmin = {
      adminId: generateAdminId(admins),
      username: cleanUsername,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    admins.push(newAdmin);
    await writeJson('admins.json', admins);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Setup error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
