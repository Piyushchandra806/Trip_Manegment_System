import { NextResponse } from 'next/server';
import { readJson } from '@/lib/data';

export async function GET() {
  const history = await readJson('import_history.json');
  return NextResponse.json(history);
}
