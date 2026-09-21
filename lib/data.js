import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

export async function readJson(filename) {
  try {
    const filePath = path.join(dataDir, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function writeJson(filename, data) {
  const filePath = path.join(dataDir, filename);
  const tempPath = path.join(dataDir, `${filename}.tmp`);
  
  // Write to temp file first, then rename for atomic write
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}
