import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { resolveProjectPath } from '@/lib/paths';
import { listSessions } from '@/lib/db/sessions';

const AGENTS_DIR = resolveProjectPath('agents');

export async function GET() {
  let agentFiles: string[];
  try {
    agentFiles = await fs.readdir(AGENTS_DIR);
  } catch {
    return NextResponse.json([]);
  }

  const agentProfiles = await Promise.all(
    agentFiles
      .filter((f) => f.endsWith('.json'))
      .map(async (f) => {
        try {
          const raw = await fs.readFile(path.join(AGENTS_DIR, f), 'utf8');
          return JSON.parse(raw) as { id: string; name: string; icon: string };
        } catch {
          return null;
        }
      })
  );

  const sessions = await listSessions();
  const latestByAgent = new Map<string, typeof sessions[number]>();
  for (const s of sessions) {
    const existing = latestByAgent.get(s.agent_id);
    if (!existing || s.created_at > existing.created_at) {
      latestByAgent.set(s.agent_id, s);
    }
  }

  const statuses = agentProfiles.filter(Boolean).map((agent) => {
    const session = latestByAgent.get(agent!.id);
    let status: 'running' | 'idle' | 'completed' = 'idle';
    let lastActivity: string | null = null;
    let currentTask: string | null = null;
    if (session) {
      if (session.status === 'running') status = 'running';
      else if (session.status === 'completed') status = 'completed';
      lastActivity = session.updated_at;
      currentTask = session.mode === 'goal' ? 'Goal mode' : 'Chat mode';
    }
    return {
      agentId: agent!.id,
      name: agent!.name,
      icon: agent!.icon,
      status,
      lastActivity,
      currentTask,
    };
  });

  return NextResponse.json(statuses);
}
