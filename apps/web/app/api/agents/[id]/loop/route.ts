import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/agents';
import { runTool } from '@/lib/tools';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;
  const agent = await getAgent(agentId);
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const body = await request.json();
  const { task, filePath, fileContent } = body as {
    task?: string;
    filePath?: string;
    fileContent?: string;
  };

  const steps: Array<{ tool: string; result: unknown }> = [];

  if (filePath) {
    const result = await runTool(agentId, 'read_file', { path: filePath });
    steps.push({ tool: 'read_file', result });
  }

  let finalDiff: unknown = null;
  if (filePath && fileContent !== undefined) {
    const result = await runTool(agentId, 'edit_file', { path: filePath, content: fileContent });
    finalDiff = result;
    steps.push({ tool: 'edit_file', result });
  }

  let testResult: unknown = null;
  try {
    testResult = await runTool(agentId, 'run_tests', {});
    steps.push({ tool: 'run_tests', result: testResult });
  } catch (error) {
    testResult = { error: String(error) };
    steps.push({ tool: 'run_tests', result: testResult });
  }

  return NextResponse.json({
    agentId,
    task: task ?? null,
    steps,
    finalDiff,
    testResult
  });
}
