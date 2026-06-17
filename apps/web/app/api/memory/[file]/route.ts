import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { resolveProjectPath } from '@/lib/paths';

function resolveSafe(file: string): string | null {
  if (file.includes('..')) return null;
  const memoryDir = resolveProjectPath('memory');
  const resolved = path.resolve(memoryDir, file);
  if (!resolved.startsWith(memoryDir)) return null;
  return resolved;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const resolved = resolveSafe(file);
  if (!resolved) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  try {
    const content = await fs.readFile(resolved, 'utf-8');
    return NextResponse.json({ name: file, content });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const resolved = resolveSafe(file);
  if (!resolved) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { content } = body;
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }
    await fs.writeFile(resolved, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}
