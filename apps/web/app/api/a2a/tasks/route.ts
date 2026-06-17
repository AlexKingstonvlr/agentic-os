import { NextRequest, NextResponse } from 'next/server';
import type { A2ATask } from '@/lib/a2a/types';
import { loadTasks, saveTasks } from '@/lib/a2a/tasks-store';
import { sendTask } from '@/lib/a2a/client';
import { getAgent } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const { targetAgentId, type, input, targetUrl } = await request.json();
    if (!targetAgentId || !type) {
      return NextResponse.json({ error: 'targetAgentId and type are required' }, { status: 400 });
    }

    const task: A2ATask = {
      id: `a2a-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      requester: 'local',
      target: targetAgentId,
      type,
      input,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (targetUrl) {
      const remoteTask = await sendTask(targetUrl, task);
      if (remoteTask) {
        const tasks = await loadTasks();
        tasks[task.id] = remoteTask;
        await saveTasks(tasks);
        return NextResponse.json(remoteTask);
      }
      return NextResponse.json({ error: 'Failed to delegate task to remote agent' }, { status: 502 });
    }

    const tasks = await loadTasks();
    tasks[task.id] = { ...task, status: 'running' };
    await saveTasks(tasks);

    const profile = await getAgent(targetAgentId);
    if (!profile) {
      tasks[task.id] = { ...task, status: 'failed', output: 'Agent not found', completedAt: new Date().toISOString() };
      await saveTasks(tasks);
      return NextResponse.json(tasks[task.id]);
    }

    processTask(task.id, type, input, profile);
    const updated = await loadTasks();
    return NextResponse.json(updated[task.id] ?? task);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function GET() {
  const tasks = await loadTasks();
  return NextResponse.json(Object.values(tasks).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

async function processTask(taskId: string, type: string, input: any, profile: { id: string; name: string }) {
  let output: any;
  if (type === 'message') {
    output = `Message received by ${profile.name}: ${typeof input === 'string' ? input : JSON.stringify(input)}`;
  } else {
    output = `Task type "${type}" processed by ${profile.name}`;
  }

  const tasks = await loadTasks();
  if (tasks[taskId]) {
    tasks[taskId] = { ...tasks[taskId], status: 'completed', output, completedAt: new Date().toISOString() };
    await saveTasks(tasks);
  }
}
