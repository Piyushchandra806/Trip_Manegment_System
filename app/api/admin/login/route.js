import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { readJson } from '@/lib/data';
import { verifyPassword } from '@/lib/crypto';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const admins = await readJson('admins.json');
    const admin = admins.find(a => a.username.toLowerCase() === username.toLowerCase());

    if (admin && verifyPassword(password, admin.passwordHash)) {
      const token = await createSession({ admin: true, username: admin.username, adminId: admin.adminId });
      
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
