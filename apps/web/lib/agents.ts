import fs from 'fs/promises';
import path from 'path';
import type { AgentProfile } from './types';
import { resolveProjectPath } from './paths';

const agentsDir = resolveProjectPath(process.env.AGENTS_DIR ?? 'agents');

export async function getAgents() {
  const files = await fs.readdir(agentsDir);
  const profiles = await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(agentsDir, file), 'utf8');
        return JSON.parse(raw) as AgentProfile;
      })
  );

  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAgent(id: string) {
  const agents = await getAgents();
  return agents.find((agent) => agent.id === id) ?? null;
}
