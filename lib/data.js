import fsLocal from 'fs/promises';
import path from 'path';
import { put, list, del } from '@vercel/blob';

const dataDir = path.join(process.cwd(), 'data');

// Helper to check if Vercel Blob should be used
const useBlob = () => {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
};

export async function readJson(filename) {
  if (useBlob()) {
    try {
      // Find the latest blob matching the filename prefix
      const { blobs } = await list({ prefix: filename });
      if (blobs.length === 0) {
        return []; // Default if no file exists
      }
      
      // Sort to get the most recently uploaded
      blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      const latestBlob = blobs[0];
      
      const response = await fetch(latestBlob.downloadUrl || latestBlob.url, { cache: 'no-store' });
      if (!response.ok) return [];
      
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error) {
      console.error('Blob read error:', error);
      return [];
    }
  } else {
    // Local File System Fallback
    try {
      const filePath = path.join(dataDir, filename);
      const data = await fsLocal.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}

export async function writeJson(filename, data) {
  const jsonString = JSON.stringify(data, null, 2);

  if (useBlob()) {
    try {
      // 1. Upload the new file version
      const { url } = await put(filename, jsonString, { 
        access: 'private',
        addRandomSuffix: true // Default behavior, assigns unique ID to avoid CDN cache issues
      });

      // 2. Cleanup old versions to prevent infinite storage growth
      const { blobs } = await list({ prefix: filename });
      const oldBlobs = blobs.filter(b => b.url !== url).map(b => b.url);
      
      if (oldBlobs.length > 0) {
        await del(oldBlobs);
      }
    } catch (error) {
      console.error('Blob write error:', error);
      throw error;
    }
  } else {
    // Local File System Fallback
    const filePath = path.join(dataDir, filename);
    const tempPath = path.join(dataDir, `${filename}.tmp`);
    
    // Write to temp file first, then rename for atomic write
    await fsLocal.writeFile(tempPath, jsonString, 'utf8');
    await fsLocal.rename(tempPath, filePath);
  }
}
