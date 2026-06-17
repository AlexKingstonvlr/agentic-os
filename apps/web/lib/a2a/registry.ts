import fs from 'fs/promises';
import path from 'path';
import { getDataDir } from '@/lib/paths';
import type { AgentCard } from './types';

const REGISTRY_FILE = path.join(getDataDir(), 'a2a-registry.json');

interface RegistryDB {
  local: Record<string, AgentCard>;
  remote: Record<string, AgentCard>;
}

let cache: RegistryDB | null = null;

async function load(): Promise<RegistryDB> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(REGISTRY_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch {
    cache = { local: {}, remote: {} };
  }
  return cache!;
}

async function persist() {
  await fs.mkdir(getDataDir(), { recursive: true });
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export async function registerAgent(agentId: string, card: AgentCard): Promise<void> {
  const db = await load();
  db.local[agentId] = card;
  await persist();
}

export async function getAgentCard(agentId: string): Promise<AgentCard | null> {
  const db = await load();
  return db.local[agentId] ?? db.remote[agentId] ?? null;
}

export async function listAllCards(): Promise<{ local: Record<string, AgentCard>; remote: Record<string, AgentCard> }> {
  const db = await load();
  return { local: { ...db.local }, remote: { ...db.remote } };
}

export async function discoverAgent(url: string): Promise<AgentCard | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const card: AgentCard = await res.json();
    const db = await load();
    db.remote[url] = card;
    await persist();
    return card;
  } catch {
    return null;
  }
}

export async function unregisterAgent(agentId: string): Promise<void> {
  const db = await load();
  delete db.local[agentId];
  delete db.remote[agentId];
  await persist();
}
