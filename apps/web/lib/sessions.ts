import type { ChatMessage } from './types';
import { resolveProjectPath } from './paths';
import fs from 'fs/promises';
import path from 'path';

/** Generate a unique session identifier */
export function createSessionId(agentId: string) {
  return `${agentId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Helper to locate a session file (JSON) inside the data directory
function getSessionFilePath(sessionId: string) {
  const dir = resolveProjectPath(process.env.DATA_DIR ?? 'data', 'sessions');
  return path.join(dir, `${sessionId}.json`);
}

/** Retrieve messages for a session, ordered as stored */
export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const data = await fs.readFile(getSessionFilePath(sessionId), 'utf8');
    return JSON.parse(data) as ChatMessage[];
  } catch {
    // If file doesn't exist, return empty array
    return [];
  }
}

/** Replace the entire message list for a session (writes JSON file) */
export async function saveMessages(sessionId: string, messages: ChatMessage[]): Promise<ChatMessage[]> {
  const filePath = getSessionFilePath(sessionId);
  // Ensure directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(messages, null, 2), 'utf8');
  return messages;
}
