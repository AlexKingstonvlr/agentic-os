import { NextRequest, NextResponse } from 'next/server';
import type { AgentCard, A2ATask } from './types';
import { runTool } from '@/lib/tools';
import { getAgent } from '@/lib/agents';
import { loadTasks, saveTasks } from './tasks-store';

export function handleAgentCard(request: NextRequest, card: AgentCard): NextResponse {
  return NextResponse.json(card);
}

export async function handleTaskSubmission(request: NextRequest): Promise<NextResponse> {
  try {
    const task: A2ATask = await request.json();
    const tasks = await loadTasks();
    tasks[task.id] = { ...task, status: 'running' };
    await saveTasks(tasks);

    processTask(task.id, task.target, task.type, task.input);

    const updated = await loadTasks();
    return NextResponse.json(updated[task.id] ?? task);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid task payload' }, { status: 400 });
  }
}

export function handleTaskStatus(request: NextRequest, taskId: string): NextResponse {
  return NextResponse.json({ taskId, status: 'running' });
}

export function handleTaskCancel(request: NextRequest, taskId: string): NextResponse {
  return NextResponse.json({ taskId, status: 'cancelled' });
}

async function processTask(taskId: string, agentId: string, type: string, input: any) {
  try {
    const profile = await getAgent(agentId);
    if (!profile) throw new Error(`Agent ${agentId} not found`);

    let output: any;
    if (type === 'tool') {
      const toolName = typeof input === 'object' && input !== null ? input.tool : undefined;
      const toolArgs = typeof input === 'object' && input !== null ? input.args ?? {} : {};
      if (toolName && profile.tools.includes(toolName)) {
        output = await runTool(agentId, toolName, toolArgs as Record<string, unknown>);
      } else {
        output = `Unknown tool or tool not available for agent ${profile.name}`;
      }
    } else if (type === 'message') {
      output = `Task received by ${profile.name}: ${typeof input === 'string' ? input : JSON.stringify(input)}`;
    } else {
      output = `Unknown task type: ${type}`;
    }

    const tasks = await loadTasks();
    if (tasks[taskId]) {
      tasks[taskId] = { ...tasks[taskId], status: 'completed', output, completedAt: new Date().toISOString() };
      await saveTasks(tasks);
    }
  } catch (error: any) {
    const tasks = await loadTasks();
    if (tasks[taskId]) {
      tasks[taskId] = { ...tasks[taskId], status: 'failed', output: error.message, completedAt: new Date().toISOString() };
      await saveTasks(tasks);
    }
  }
}
