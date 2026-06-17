import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/db/events';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const events = await getEvents(id);
    return NextResponse.json({ sessionId: id, events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get events' },
      { status: 500 }
    );
  }
}
