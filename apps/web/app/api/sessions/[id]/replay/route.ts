import { NextResponse } from 'next/server';
import { getReplayActions } from '@/lib/db/events';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actions = await getReplayActions(id);
    return NextResponse.json({ sessionId: id, actions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get replay' },
      { status: 500 }
    );
  }
}
