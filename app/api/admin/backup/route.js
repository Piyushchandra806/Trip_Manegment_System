import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const zip = new AdmZip();
    
    // Add all json files in dataDir
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          zip.addLocalFile(path.join(dataDir, file));
        }
      }
    }
    
    const zipBuffer = zip.toBuffer();

    await logActivity('Created Backup', 'Downloaded full system backup');

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="trip-backup-${new Date().toISOString().split('T')[0]}.zip"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}
