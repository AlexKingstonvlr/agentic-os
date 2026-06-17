import { NextResponse } from 'next/server';
import { createMission, listMissions } from '@/lib/missions';

export async function GET() {
  const missions = await listMissions();
  return NextResponse.json(missions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, goal } = body as { title: string; goal: string };
  if (!title || !goal) {
    return NextResponse.json({ error: 'title and goal are required' }, { status: 400 });
  }
  const mission = await createMission(title, goal);
  return NextResponse.json(mission, { status: 201 });
}
