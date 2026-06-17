import fs from 'fs/promises';
import path from 'path';
import { getDataDir } from '@/lib/paths';

const DATA_DIR = getDataDir();
const DB_FILE = path.join(DATA_DIR, 'events.json');

interface EventsDB {
  nextId: number;
  events: Array<{
    id: number;
    session_id: string | null;
    type: string;
    payload_json: string;
    created_at: string;
  }>;
}

let cache: EventsDB | null = null;

async function load(): Promise<EventsDB> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch {
    cache = { nextId: 1, events: [] };
  }
  return cache!;
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export interface EventRecord {
  id: number;
  session_id: string | null;
  type: string;
  payload_json: string;
  created_at: string;
}

export async function addEvent(sessionId: string | null, type: string, payload: unknown = {}): Promise<EventRecord> {
  const db = await load();
  const now = new Date().toISOString();
  const event: EventRecord = {
    id: db.nextId++,
    session_id: sessionId,
    type,
    payload_json: JSON.stringify(payload),
    created_at: now
  };
  db.events.push(event);
  await persist();
  return event;
}

export async function getEvents(sessionId: string, limit = 100): Promise<EventRecord[]> {
  const db = await load();
  return db.events
    .filter(e => e.session_id === sessionId)
    .slice(-limit)
    .reverse();
}

export async function listRecentEvents(limit = 50): Promise<EventRecord[]> {
  const db = await load();
  return db.events.slice(-limit).reverse();
}

export async function getReplayActions(sessionId: string) {
  const events = await getEvents(sessionId);
  return events.map(e => ({
    type: e.type,
    payload: JSON.parse(e.payload_json),
    timestamp: e.created_at,
  }));
}
