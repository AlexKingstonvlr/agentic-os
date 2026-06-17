import fs from 'fs/promises';
import path from 'path';
import { getDataDir } from '@/lib/paths';
import type { A2ATask } from './types';

const TASKS_FILE = path.join(getDataDir(), 'a2a-tasks.json');

let cache: Record<string, A2ATask> | null = null;

export async function loadTasks(): Promise<Record<string, A2ATask>> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(TASKS_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch {
    cache = {};
  }
  return cache!;
}

export async function saveTasks(tasks: Record<string, A2ATask>): Promise<void> {
  cache = { ...tasks };
  await fs.mkdir(getDataDir(), { recursive: true });
  await fs.writeFile(TASKS_FILE, JSON.stringify(cache, null, 2), 'utf8');
}
