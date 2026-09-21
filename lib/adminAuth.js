import { verifySession } from './auth';
import { connectToDatabase } from './mongodb';
import { hashPassword, verifyPassword } from './crypto';

function normalizeUsername(username) {
  if (!username) return '';
  return username.trim();
}

async function generateAdminId(db) {
  const admins = await db.collection('admins').find({}).toArray();
  const nums = admins.map(a => parseInt(a.adminId.replace('AD', '')) || 0);
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return 'AD' + String(max + 1).padStart(6, '0');
}

export async function getAdminByUsername(username) {
  const cleanUsername = normalizeUsername(username);
  if (!cleanUsername) return null;

  try {
    const { db } = await connectToDatabase();
    const admin = await db.collection('admins').findOne({ 
      username: { $regex: `^${cleanUsername}$`, $options: 'i' } 
    });
    return admin;
  } catch (error) {
    console.error('Failed to getAdminByUsername:', error);
    throw error;
  }
}

export async function createAdmin(username, password) {
  const cleanUsername = normalizeUsername(username);
  
  if (!cleanUsername) {
    throw new Error('Username is required');
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const existingAdmin = await getAdminByUsername(cleanUsername);
  if (existingAdmin) {
    throw new Error('Username already exists. Please choose another username.');
  }

  try {
    const { db } = await connectToDatabase();
    
    const newAdmin = {
      adminId: await generateAdminId(db),
      username: cleanUsername,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('admins').insertOne(newAdmin);
    return newAdmin;
  } catch (error) {
    console.error('Failed to create admin:', error);
    throw error;
  }
}

export function verifyAdminPassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) return false;
  return verifyPassword(plainPassword, passwordHash);
}

export async function hasAnyAdmins() {
  try {
    const { db } = await connectToDatabase();
    const count = await db.collection('admins').countDocuments();
    return count > 0;
  } catch (error) {
    console.error('Failed to check admins:', error);
    throw error; 
  }
}

export async function getLoggedInAdmin(request) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload || !payload.adminId) return null;
  return { adminId: payload.adminId, username: payload.username };
}
