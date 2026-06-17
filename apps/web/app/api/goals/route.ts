import { NextResponse } from 'next/server';
import { createGoal, listGoals } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { agentId, title, prompt } = body as {
    agentId: string;
    title: string;
    prompt: string;
  };

  if (!agentId || !title || !prompt) {
    return NextResponse.json({ error: 'agentId, title, and prompt are required' }, { status: 400 });
  }

  const goal = await createGoal(agentId, title, prompt);
  return NextResponse.json(goal);
}

export async function GET() {
  const goals = await listGoals();
  return NextResponse.json(goals);
}
