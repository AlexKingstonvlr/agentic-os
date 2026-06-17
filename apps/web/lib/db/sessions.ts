import fs from 'fs/promises';
import path from 'path';
import { getDataDir } from '@/lib/paths';

const DATA_DIR = getDataDir();
const DB_FILE = path.join(DATA_DIR, 'sessions.json');

interface SessionDB {
  nextId: number;
  sessions: Record<string, {
    id: string;
    agent_id: string;
    mode: string;
    status: string;
    created_at: string;
    updated_at: string;
    ended_at: string | null;
    messages: Array<{ id: number; role: string; content: string; created_at: string; session_id?: string }>;
  }>;
}

let cache: SessionDB | null = null;

async function load(): Promise<SessionDB> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch {
    cache = { nextId: 1, sessions: {} };
  }
  return cache!;
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export interface SessionRecord {
  id: string;
  agent_id: string;
  mode: string;
  status: string;
  created_at: string;
  updated_at: string;
  ended_at: string | null;
}

export interface MessageRecord {
  id: number;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

export async function createSession(agentId: string, mode: 'chat' | 'goal' = 'chat'): Promise<string> {
  const db = await load();
  const sessionId = `${agentId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const now = new Date().toISOString();
  db.sessions[sessionId] = {
    id: sessionId,
    agent_id: agentId,
    mode,
    status: 'running',
    created_at: now,
    updated_at: now,
    ended_at: null,
    messages: []
  };
  await persist();
  return sessionId;
}

export async function getSession(sessionId: string): Promise<SessionRecord | undefined> {
  const db = await load();
  const s = db.sessions[sessionId];
  if (!s) return undefined;
  const { messages, ...rest } = s;
  return rest;
}

export async function addMessage(sessionId: string, role: string, content: string): Promise<MessageRecord> {
  const db = await load();
  const session = db.sessions[sessionId];
  if (!session) throw new Error(`Session ${sessionId} not found`);
  const msg: MessageRecord = {
    id: db.nextId++,
    session_id: sessionId,
    role,
    content,
    created_at: new Date().toISOString()
  };
  session.messages.push(msg);
  session.updated_at = msg.created_at;
  await persist();
  return msg;
}

export async function getMessages(sessionId: string): Promise<MessageRecord[]> {
  const db = await load();
  const session = db.sessions[sessionId];
  if (!session) return [];
  return session.messages.map(m => ({ ...m, session_id: sessionId }));
}

export async function updateSessionStatus(sessionId: string, status: string): Promise<void> {
  const db = await load();
  const session = db.sessions[sessionId];
  if (!session) return;
  session.status = status;
  session.updated_at = new Date().toISOString();
  if (status === 'completed' || status === 'stopped') session.ended_at = session.updated_at;
  await persist();
}

export async function listSessions(agentId?: string): Promise<SessionRecord[]> {
  const db = await load();
  const all = Object.values(db.sessions);
  const filtered = agentId ? all.filter(s => s.agent_id === agentId) : all;
  const { messages, ...rest } = filtered?.[0] ?? {};
  return filtered.map(({ messages, ...r }) => r).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
