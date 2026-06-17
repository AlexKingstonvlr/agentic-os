import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { resolveProjectPath } from '@/lib/paths';

export async function GET(request: NextRequest) {
  try {
    const memoryDir = resolveProjectPath('memory');
    const search = request.nextUrl.searchParams.get('search');

    let entries: string[];
    try {
      entries = await fs.readdir(memoryDir);
    } catch {
      return NextResponse.json([]);
    }

    const filtered = await Promise.all(
      entries.map(async (name) => {
        const filePath = path.join(memoryDir, name);
        try {
          const stat = await fs.stat(filePath);
          if (!stat.isFile()) return null;
          return name;
        } catch {
          return null;
        }
      })
    );
    const files = filtered.filter(Boolean) as string[];

    const results = await Promise.all(
      files.map(async (name) => {
        const content = await fs.readFile(path.join(memoryDir, name), 'utf-8');
        return { name, path: name, content };
      })
    );

    if (search) {
      const q = search.toLowerCase();
      const filtered = results.filter((r) => r.content.toLowerCase().includes(q));
      return NextResponse.json(
        filtered.map((r) => ({
          name: r.name,
          path: r.path,
          content: r.content,
          snippets: r.content
            .split('\n')
            .filter((line) => line.toLowerCase().includes(q))
        }))
      );
    }

    return NextResponse.json(
      results.map((r) => ({
        name: r.name,
        path: r.path,
        preview: r.content.slice(0, 200)
      }))
    );
  } catch {
    return NextResponse.json({ error: 'Failed to read memory' }, { status: 500 });
  }
}
