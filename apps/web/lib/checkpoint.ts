import fs from 'fs/promises';
import path from 'path';
import { getDataDir } from '@/lib/paths';
import { addEvent } from '@/lib/db/events';

const DATA_DIR = getDataDir();
const DB_FILE = path.join(DATA_DIR, 'checkpoints.json');

export interface Checkpoint {
  id: string;
  sessionId: string;
  agentId: string;
  actionType: string;
  data: unknown;
  status: 'pending' | 'approved' | 'rejected';
  toolIndex: number;
  createdAt: string;
  resolvedAt: string | null;
  resolution: { modifications?: unknown; reason?: string } | null;
}

interface CheckpointsDB {
  checkpoints: Checkpoint[];
}

let cache: CheckpointsDB | null = null;

async function load(): Promise<CheckpointsDB> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch {
    cache = { checkpoints: [] };
  }
  return cache!;
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export async function createCheckpoint(
  sessionId: string,
  agentId: string,
  actionType: string,
  data: unknown,
  toolIndex = 0
): Promise<Checkpoint> {
  const db = await load();
  const now = new Date().toISOString();
  const checkpoint: Checkpoint = {
    id: `${sessionId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sessionId,
    agentId,
    actionType,
    data,
    status: 'pending',
    toolIndex,
    createdAt: now,
    resolvedAt: null,
    resolution: null,
  };
  db.checkpoints.push(checkpoint);
  await persist();
  await addEvent(sessionId, 'checkpoint.created', { checkpointId: checkpoint.id, actionType, data });
  return checkpoint;
}

export async function getPendingCheckpoints(sessionId: string): Promise<Checkpoint[]> {
  const db = await load();
  return db.checkpoints.filter(
    (cp) => cp.sessionId === sessionId && cp.status === 'pending'
  ).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
  const db = await load();
  return db.checkpoints.find((cp) => cp.id === checkpointId) ?? null;
}

export async function approveCheckpoint(
  checkpointId: string,
  modifications?: unknown
): Promise<Checkpoint | null> {
  const db = await load();
  const cp = db.checkpoints.find((c) => c.id === checkpointId);
  if (!cp || cp.status !== 'pending') return null;
  cp.status = 'approved';
  cp.resolvedAt = new Date().toISOString();
  cp.resolution = modifications !== undefined ? { modifications } : {};
  if (modifications !== undefined) {
    cp.data = modifications;
  }
  await persist();
  await addEvent(cp.sessionId, 'checkpoint.approved', { checkpointId, modifications });
  return cp;
}

export async function rejectCheckpoint(
  checkpointId: string,
  reason?: string
): Promise<Checkpoint | null> {
  const db = await load();
  const cp = db.checkpoints.find((c) => c.id === checkpointId);
  if (!cp || cp.status !== 'pending') return null;
  cp.status = 'rejected';
  cp.resolvedAt = new Date().toISOString();
  cp.resolution = reason ? { reason } : {};
  await persist();
  await addEvent(cp.sessionId, 'checkpoint.rejected', { checkpointId, reason });
  return cp;
}

export async function listAgentPendingCheckpoints(agentId: string): Promise<Checkpoint[]> {
  const db = await load();
  return db.checkpoints.filter(
    (cp) => cp.agentId === agentId && cp.status === 'pending'
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
