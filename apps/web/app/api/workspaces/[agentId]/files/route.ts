import { NextRequest, NextResponse } from 'next/server';
import { listWorkspaceFiles, readFileInWorkspace, writeFileInWorkspace } from '@/lib/workspace';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  try {
    if (path) {
      const content = await readFileInWorkspace(agentId, path);
      return NextResponse.json({ content });
    }

    const files = await listWorkspaceFiles(agentId);
    return NextResponse.json({ files });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  try {
    const { path, content } = await request.json();

    if (!path || content === undefined) {
      return NextResponse.json({ error: 'path and content are required' }, { status: 400 });
    }

    await writeFileInWorkspace(agentId, path, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}