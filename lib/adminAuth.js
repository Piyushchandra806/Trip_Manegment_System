import { readJson, writeJson } from './data';
import { hashPassword, verifyPassword } from './crypto';

/**
 * Normalizes a username by trimming whitespace.
 * We do not force lowercase here, but we do case-insensitive comparisons later.
 */
function normalizeUsername(username) {
  if (!username) return '';
  return username.trim();
}

/**
 * Generates a new unique Admin ID (e.g., AD000001)
 */
function generateAdminId(admins) {
  const nums = admins.map(a => parseInt(a.adminId.replace('AD', '')) || 0);
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return 'AD' + String(max + 1).padStart(6, '0');
}

/**
 * Fetches an admin by their username (case-insensitive)
 */
export async function getAdminByUsername(username) {
  const cleanUsername = normalizeUsername(username);
  if (!cleanUsername) return null;

  try {
    const admins = await readJson('admins.json');
    return admins.find(a => a.username.toLowerCase() === cleanUsername.toLowerCase()) || null;
  } catch (error) {
    console.error('Failed to read admins for getAdminByUsername:', error);
    throw error;
  }
}

/**
 * Creates a new admin account
 */
export async function createAdmin(username, password) {
  const cleanUsername = normalizeUsername(username);
  
  if (!cleanUsername) {
    throw new Error('Username is required');
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Double-check if username exists to prevent duplicates
  const existingAdmin = await getAdminByUsername(cleanUsername);
  if (existingAdmin) {
    throw new Error('Username already exists. Please choose another username.');
  }

  try {
    const admins = await readJson('admins.json');
    
    const newAdmin = {
      adminId: generateAdminId(admins),
      username: cleanUsername,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    admins.push(newAdmin);
    
    // Write securely. If this fails on Vercel, it throws an error and prevents false success.
    await writeJson('admins.json', admins);
    
    return newAdmin;
  } catch (error) {
    console.error('Failed to create admin:', error);
    throw error; // Let the API handler catch and return 500
  }
}

/**
 * Verifies if the provided plain-text password matches the hashed password
 */
export function verifyAdminPassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) return false;
  return verifyPassword(plainPassword, passwordHash);
}

/**
 * Checks if the system has any admins at all.
 * Used by /setup to lock down the page after the first admin is created.
 */
export async function hasAnyAdmins() {
  try {
    const admins = await readJson('admins.json');
    return admins.length > 0;
  } catch (error) {
    console.error('Failed to check admins:', error);
    // If it fails to read, we should throw to prevent bypassing setup lockdown
    throw error; 
  }
}
