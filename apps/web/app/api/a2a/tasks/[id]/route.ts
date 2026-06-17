import { NextRequest, NextResponse } from 'next/server';
import { loadTasks } from '@/lib/a2a/tasks-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tasks = await loadTasks();
  const task = tasks[id];
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json(task);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tasks = await loadTasks();
  if (!tasks[id]) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  tasks[id] = { ...tasks[id], status: 'failed', output: 'Cancelled by user', completedAt: new Date().toISOString() };
  await import('@/lib/a2a/tasks-store').then(m => m.saveTasks(tasks));
  return NextResponse.json({ success: true });
}
