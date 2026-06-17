import { NextResponse } from 'next/server';
import { addTask } from '@/lib/missions';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { title, assignedAgentId } = body as { title: string; assignedAgentId: string };
  if (!title || !assignedAgentId) {
    return NextResponse.json({ error: 'title and assignedAgentId are required' }, { status: 400 });
  }
  try {
    const mission = await addTask(id, title, assignedAgentId);
    return NextResponse.json(mission);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}
