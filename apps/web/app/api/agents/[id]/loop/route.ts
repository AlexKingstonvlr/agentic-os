import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/agents';
import { runTool, tools } from '@/lib/tools';
import { createCheckpoint, getCheckpoint } from '@/lib/checkpoint';
import { createSession } from '@/lib/db/sessions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;
  const agent = await getAgent(agentId);
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const body = await request.json();
  const { task, filePath, fileContent, sessionId: providedSessionId, resumeCheckpointId } = body as {
    task?: string;
    filePath?: string;
    fileContent?: string;
    sessionId?: string;
    resumeCheckpointId?: string;
  };

  const sessionId = providedSessionId ?? await createSession(agentId);

  const plannedTools: Array<{ name: string; args: Record<string, unknown> }> = [];
  if (filePath) {
    plannedTools.push({ name: 'read_file', args: { path: filePath } });
  }
  if (filePath && fileContent !== undefined) {
    plannedTools.push({ name: 'edit_file', args: { path: filePath, content: fileContent } });
  }
  plannedTools.push({ name: 'run_tests', args: {} });

  const steps: Array<{ tool: string; result: unknown }> = [];
  let startIndex = 0;

  if (resumeCheckpointId) {
    const checkpoint = await getCheckpoint(resumeCheckpointId);
    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }
    if (checkpoint.status !== 'approved') {
      return NextResponse.json({ error: 'Checkpoint not yet approved' }, { status: 400 });
    }

    const toolArgs = (checkpoint.data ?? {}) as Record<string, unknown>;
    const result = await runTool(agentId, checkpoint.actionType, toolArgs);
    steps.push({ tool: checkpoint.actionType, result });

    const idx = plannedTools.findIndex(
      (t, i) => t.name === checkpoint.actionType && i >= checkpoint.toolIndex
    );
    startIndex = idx >= 0 ? idx + 1 : checkpoint.toolIndex + 1;
  }

  for (let i = startIndex; i < plannedTools.length; i++) {
    const tool = plannedTools[i];
    const toolDef = tools.find((t) => t.name === tool.name);
    const permissionKey = toolDef?.permission;
    const permission = permissionKey ? agent.permissions[permissionKey] : true;

    if (permission === 'ask') {
      const checkpoint = await createCheckpoint(sessionId, agentId, tool.name, tool.args, i);
      return NextResponse.json({
        action: 'awaiting_approval',
        checkpointId: checkpoint.id,
        sessionId,
        steps,
      });
    }

    const result = await runTool(agentId, tool.name, tool.args);
    steps.push({ tool: tool.name, result });
  }

  return NextResponse.json({
    agentId,
    sessionId,
    task: task ?? null,
    steps,
    status: 'completed',
  });
}
