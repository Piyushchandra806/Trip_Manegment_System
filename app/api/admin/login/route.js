import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { getAdminByUsername, verifyAdminPassword } from '@/lib/adminAuth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Centralized admin fetch and verification
    const admin = await getAdminByUsername(username);

    if (admin && verifyAdminPassword(password, admin.passwordHash)) {
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

    // Security: Do not reveal whether username or password was incorrect
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
