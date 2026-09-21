import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { logActivity } from '@/lib/activity';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), 'data');
    const backupsDir = path.join(dataDir, 'backups');
    
    // Ensure backups dir exists
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // 1. Create an auto-backup of current state BEFORE restoring
    const currentZip = new AdmZip();
    const files = fs.readdirSync(dataDir);
    for (const f of files) {
      if (f.endsWith('.json')) {
        currentZip.addLocalFile(path.join(dataDir, f));
      }
    }
    currentZip.writeZip(path.join(backupsDir, `auto-backup-before-restore-${Date.now()}.zip`));

    // 2. Extract uploaded ZIP
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadZip = new AdmZip(buffer);
    const zipEntries = uploadZip.getEntries();
    
    // Only extract .json files directly into dataDir to avoid overwriting unrelated files
    for (const entry of zipEntries) {
      if (!entry.isDirectory && entry.entryName.endsWith('.json') && !entry.entryName.includes('/')) {
        // Read content and write it
        const content = uploadZip.readAsText(entry);
        fs.writeFileSync(path.join(dataDir, entry.entryName), content, 'utf8');
      }
    }

    await logActivity('Restored Backup', `Restored from file: ${file.name}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: 'We couldn\'t complete the restore operation. Please try again.' }, { status: 500 });
  }
}
