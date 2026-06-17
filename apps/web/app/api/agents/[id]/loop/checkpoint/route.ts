import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/agents';
import { runTool, tools } from '@/lib/tools';
import { getCheckpoint, approveCheckpoint, rejectCheckpoint, createCheckpoint } from '@/lib/checkpoint';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;
  const agent = await getAgent(agentId);
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const body = await request.json();
  const { action, checkpointId, modifications, task } = body as {
    action: 'approve' | 'reject';
    checkpointId: string;
    modifications?: Record<string, unknown>;
    task?: string;
  };

  if (!checkpointId || !action) {
    return NextResponse.json({ error: 'checkpointId and action required' }, { status: 400 });
  }

  if (action === 'reject') {
    const checkpoint = await rejectCheckpoint(checkpointId);
    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }
    return NextResponse.json({ checkpoint, status: 'rejected' });
  }

  const updated = await approveCheckpoint(checkpointId, modifications);
  if (!updated) {
    return NextResponse.json({ error: 'Checkpoint not found or already resolved' }, { status: 404 });
  }

  const toolArgs = (updated.data ?? {}) as Record<string, unknown>;
  const result = await runTool(agentId, updated.actionType, toolArgs);

  const steps = [{ tool: updated.actionType, result }];

  const plannedTools: Array<{ name: string; args: Record<string, unknown> }> = [];

  const { filePath, fileContent } = body as Record<string, unknown>;
  if (filePath) {
    plannedTools.push({ name: 'read_file', args: { path: String(filePath) } });
  }
  if (filePath && fileContent !== undefined) {
    plannedTools.push({ name: 'edit_file', args: { path: String(filePath), content: String(fileContent) } });
  }
  plannedTools.push({ name: 'run_tests', args: {} });

  for (let i = updated.toolIndex + 1; i < plannedTools.length; i++) {
    const tool = plannedTools[i];
    const toolDef = tools.find((t) => t.name === tool.name);
    const permissionKey = toolDef?.permission;
    const permission = permissionKey ? agent.permissions[permissionKey] : true;

    if (permission === 'ask') {
      const newCheckpoint = await createCheckpoint(
        updated.sessionId, agentId, tool.name, tool.args, i
      );
      return NextResponse.json({
        action: 'awaiting_approval',
        checkpointId: newCheckpoint.id,
        sessionId: updated.sessionId,
        steps,
      });
    }

    const toolResult = await runTool(agentId, tool.name, tool.args);
    steps.push({ tool: tool.name, result: toolResult });
  }

  return NextResponse.json({
    agentId,
    sessionId: updated.sessionId,
    task: task ?? null,
    steps,
    status: 'completed',
  });
}
