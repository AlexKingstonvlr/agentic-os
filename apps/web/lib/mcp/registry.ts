import fs from 'fs/promises';
import path from 'path';
import { getDataDir } from '@/lib/paths';
import { connectToServer, disconnectFromServer, listServerTools, testConnection } from './client';

export interface McpServerConfig {
  name: string;
  url: string;
  description: string;
  addedAt: string;
}

interface McpRegistry {
  servers: McpServerConfig[];
}

const DATA_DIR = getDataDir();
const REGISTRY_FILE = path.join(DATA_DIR, 'mcp-servers.json');

let cache: McpRegistry | null = null;

async function load(): Promise<McpRegistry> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(REGISTRY_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch {
    cache = { servers: [] };
  }
  return cache!;
}

async function persist(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export async function listServers(): Promise<McpServerConfig[]> {
  const db = await load();
  return db.servers;
}

export async function getServer(name: string): Promise<McpServerConfig | undefined> {
  const db = await load();
  return db.servers.find((s) => s.name === name);
}

export async function addServer(config: McpServerConfig): Promise<void> {
  const db = await load();
  if (db.servers.find((s) => s.name === config.name)) {
    throw new Error(`MCP server "${config.name}" already exists`);
  }
  db.servers.push(config);
  await persist();
}

export async function removeServer(name: string): Promise<void> {
  const db = await load();
  const idx = db.servers.findIndex((s) => s.name === name);
  if (idx === -1) throw new Error(`MCP server "${name}" not found`);
  db.servers.splice(idx, 1);
  await persist();
  await disconnectFromServer(name);
}

export async function connectToRegisteredServer(name: string): Promise<void> {
  const config = await getServer(name);
  if (!config) throw new Error(`MCP server "${name}" not found`);
  await connectToServer(config.name, config.url);
}

export async function testAndAddServer(config: McpServerConfig): Promise<{ ok: boolean; error?: string }> {
  const testResult = await testConnection(config.url);
  if (!testResult.ok) return testResult;
  await addServer(config);
  return { ok: true };
}
