import { NextRequest, NextResponse } from 'next/server';
import { initMemory, searchMemory } from '@/lib/memory';

export async function POST(request: NextRequest) {
  try {
    await initMemory();
    const body = await request.json();
    const { query, agentId, limit } = body;

    if (typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const results = await searchMemory(agentId || null, query, limit || 5);
    return NextResponse.json({
      results: results.map(r => ({
        id: r.id,
        text: r.text,
        metadata: r.metadata,
        score: r.score,
        snippet: r.text.length > 300 ? r.text.slice(0, 300) + '...' : r.text,
        relevance: Math.round(r.score * 100),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
