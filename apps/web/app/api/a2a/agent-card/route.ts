import { NextResponse } from 'next/server';
import { getAgents } from '@/lib/agents';
import type { AgentCard, A2ACapability } from '@/lib/a2a/types';
import { registerAgent } from '@/lib/a2a/registry';

export async function GET() {
  const profiles = await getAgents();
  const skills = new Set<string>();
  const capabilities = new Set<A2ACapability>();

  for (const p of profiles) {
    for (const s of p.skills) {
      skills.add(s);
      const mapped = mapSkillToCapability(s);
      if (mapped) capabilities.add(mapped);
    }
  }

  const card: AgentCard = {
    name: 'Agentic OS',
    description: `Multi-agent operating system with ${profiles.length} specialized agents`,
    url: process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
    capabilities: Array.from(capabilities),
    skills: Array.from(skills),
  };

  for (const p of profiles) {
    await registerAgent(p.id, {
      name: p.name,
      description: p.description,
      url: process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
      capabilities: p.skills.map(s => mapSkillToCapability(s)).filter(Boolean) as A2ACapability[],
      skills: p.skills,
    });
  }

  return NextResponse.json(card);
}

function mapSkillToCapability(skill: string): A2ACapability | null {
  const map: Record<string, A2ACapability> = {
    coding: 'code-review',
    research: 'research',
    testing: 'testing',
    chat: 'chat',
    deploy: 'deployment',
    monitor: 'monitoring',
  };
  return map[skill] ?? null;
}
