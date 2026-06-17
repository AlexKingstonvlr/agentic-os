import fs from 'node:fs/promises';
import path from 'node:path';
import { getDataDir } from '@/lib/paths';

const DATA_DIR = getDataDir();
const DB_FILE = path.join(DATA_DIR, 'goals.json');

interface GoalRecord {
  id: number;
  agentId: string;
  title: string;
  prompt: string;
  status: string;
  createdAt: string;
}

let nextId = 1;
let goals: GoalRecord[] = [];

async function load() {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    goals = data.goals ?? [];
    nextId = data.nextId ?? 1;
  } catch {
    goals = [];
    nextId = 1;
  }
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify({ goals, nextId }, null, 2), 'utf8');
}

let loaded = false;

export async function createGoal(agentId: string, title: string, prompt: string) {
  if (!loaded) { await load(); loaded = true; }
  const goal: GoalRecord = {
    id: nextId++,
    agentId,
    title,
    prompt,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  goals.push(goal);
  await persist();
  return goal;
}

export async function listGoals() {
  if (!loaded) { await load(); loaded = true; }
  return [...goals].reverse();
}
