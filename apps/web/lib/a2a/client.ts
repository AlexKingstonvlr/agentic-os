import type { A2ATask } from './types';

const DEFAULT_TIMEOUT = 10000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function sendTask(targetUrl: string, task: A2ATask): Promise<A2ATask | null> {
  try {
    const res = await fetchWithTimeout(
      `${targetUrl.replace(/\/$/, '')}/api/a2a/tasks`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function checkTaskStatus(targetUrl: string, taskId: string): Promise<A2ATask | null> {
  try {
    const res = await fetchWithTimeout(
      `${targetUrl.replace(/\/$/, '')}/api/a2a/tasks/${taskId}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function cancelTask(targetUrl: string, taskId: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${targetUrl.replace(/\/$/, '')}/api/a2a/tasks/${taskId}`,
      { method: 'DELETE' }
    );
    return res.ok;
  } catch {
    return false;
  }
}
