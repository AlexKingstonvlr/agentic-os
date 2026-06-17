import fs from 'fs/promises';
import path from 'path';
import { getDataDir } from '@/lib/paths';

const DATA_DIR = getDataDir();
const DB_FILE = path.join(DATA_DIR, 'missions.json');

export interface Task {
  id: string;
  title: string;
  assignedAgentId: string;
  status: 'backlog' | 'in_progress' | 'done';
  createdAt: string;
}

export interface Mission {
  id: string;
  title: string;
  goal: string;
  status: 'active' | 'paused' | 'completed';
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

interface MissionsDB {
  missions: Mission[];
}

let cache: MissionsDB | null = null;

async function load(): Promise<MissionsDB> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch {
    cache = { missions: [] };
  }
  return cache!;
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export async function createMission(title: string, goal: string): Promise<Mission> {
  const db = await load();
  const now = new Date().toISOString();
  const mission: Mission = {
    id: `mission-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title,
    goal,
    status: 'active',
    tasks: [],
    createdAt: now,
    updatedAt: now,
  };
  db.missions.push(mission);
  await persist();
  return mission;
}

export async function listMissions(): Promise<Mission[]> {
  const db = await load();
  return [...db.missions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getMission(missionId: string): Promise<Mission | undefined> {
  const db = await load();
  return db.missions.find((m) => m.id === missionId);
}

export async function addTask(missionId: string, title: string, agentId: string): Promise<Mission> {
  const db = await load();
  const mission = db.missions.find((m) => m.id === missionId);
  if (!mission) throw new Error(`Mission ${missionId} not found`);
  const now = new Date().toISOString();
  const task: Task = {
    id: `task-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title,
    assignedAgentId: agentId,
    status: 'backlog',
    createdAt: now,
  };
  mission.tasks.push(task);
  mission.updatedAt = now;
  await persist();
  return mission;
}

export async function completeTask(missionId: string, taskId: string): Promise<Mission> {
  const db = await load();
  const mission = db.missions.find((m) => m.id === missionId);
  if (!mission) throw new Error(`Mission ${missionId} not found`);
  const task = mission.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  task.status = 'done';
  mission.updatedAt = new Date().toISOString();
  const allDone = mission.tasks.length > 0 && mission.tasks.every((t) => t.status === 'done');
  if (allDone) mission.status = 'completed';
  await persist();
  return mission;
}
