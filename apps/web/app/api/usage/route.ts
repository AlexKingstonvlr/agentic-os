import { NextRequest, NextResponse } from 'next/server';
import { getOverallUsage, getAgentUsage } from '@/lib/cost-tracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const days = parseInt(searchParams.get('days') ?? '30', 10);
    const sessions = searchParams.has('sessions');

    if (sessions) {
      const summary = await getOverallUsage(days);
      return NextResponse.json({ sessions: summary.bySession });
    }

    if (agentId) {
      const usage = await getAgentUsage(agentId, days);
      return NextResponse.json({ agentId, days, usage });
    }

    const summary = await getOverallUsage(days);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Usage fetch failed' },
      { status: 500 }
    );
  }
}
