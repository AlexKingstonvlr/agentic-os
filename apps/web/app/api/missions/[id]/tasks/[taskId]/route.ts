import { NextResponse } from 'next/server';
import { completeTask } from '@/lib/missions';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  try {
    const mission = await completeTask(id, taskId);
    return NextResponse.json(mission);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}
