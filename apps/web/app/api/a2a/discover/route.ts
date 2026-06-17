import { NextRequest, NextResponse } from 'next/server';
import { discoverAgent, listAllCards } from '@/lib/a2a/registry';

export async function GET() {
  const cards = await listAllCards();
  return NextResponse.json(cards);
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }
    const card = await discoverAgent(url);
    if (!card) {
      return NextResponse.json({ error: 'Failed to discover agent at URL' }, { status: 404 });
    }
    return NextResponse.json(card);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
