import { NextResponse } from 'next/server';
import { reindexMemory } from '@/lib/memory';

export async function POST() {
  try {
    const count = await reindexMemory();
    return NextResponse.json({ success: true, chunks: count });
  } catch {
    return NextResponse.json({ error: 'Reindex failed' }, { status: 500 });
  }
}
