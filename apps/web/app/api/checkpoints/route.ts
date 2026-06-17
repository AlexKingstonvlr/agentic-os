import { NextRequest, NextResponse } from 'next/server';
import {
  createCheckpoint,
  getPendingCheckpoints,
  approveCheckpoint,
  rejectCheckpoint,
} from '@/lib/checkpoint';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const agentId = searchParams.get('agentId');
  const status = searchParams.get('status');

  if (sessionId) {
    const checkpoints = await getPendingCheckpoints(sessionId);
    return NextResponse.json({ checkpoints });
  }

  if (agentId) {
    const { listAgentPendingCheckpoints } = await import('@/lib/checkpoint');
    const checkpoints = await listAgentPendingCheckpoints(agentId);
    return NextResponse.json({ checkpoints });
  }

  return NextResponse.json({ error: 'sessionId or agentId required' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, agentId, actionType, data, toolIndex } = body as {
    sessionId: string;
    agentId: string;
    actionType: string;
    data: unknown;
    toolIndex?: number;
  };

  if (!sessionId || !agentId || !actionType) {
    return NextResponse.json({ error: 'sessionId, agentId, and actionType required' }, { status: 400 });
  }

  const checkpoint = await createCheckpoint(sessionId, agentId, actionType, data, toolIndex ?? 0);
  return NextResponse.json({ checkpoint });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, action, modifications, reason } = body as {
    id: string;
    action: 'approve' | 'reject';
    modifications?: unknown;
    reason?: string;
  };

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action required' }, { status: 400 });
  }

  let checkpoint = null;
  if (action === 'approve') {
    checkpoint = await approveCheckpoint(id, modifications);
  } else if (action === 'reject') {
    checkpoint = await rejectCheckpoint(id, reason);
  }

  if (!checkpoint) {
    return NextResponse.json({ error: 'Checkpoint not found or already resolved' }, { status: 404 });
  }

  return NextResponse.json({ checkpoint });
}
