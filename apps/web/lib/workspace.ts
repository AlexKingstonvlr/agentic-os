import fs from 'fs/promises';
import path from 'path';
import { resolveProjectPath } from './paths';

const workspaceRoot = resolveProjectPath(process.env.WORKSPACE_ROOT ?? 'workspaces');

function safePath(agentId: string, requestedPath: string) {
  const base = path.resolve(workspaceRoot, agentId);
  const target = path.resolve(base, requestedPath.replace(/^\/+/, ''));
  if (!target.startsWith(base)) throw new Error('Path escapes workspace');
  return target;
}

export async function listWorkspaceFiles(agentId: string) {
  const base = path.resolve(workspaceRoot, agentId);
  await fs.mkdir(base, { recursive: true });
  const entries = await fs.readdir(base, { withFileTypes: true });
  return entries.map((entry) => ({
    name: entry.name,
    type: entry.isDirectory() ? 'directory' : 'file'
  }));
}

export async function readFileInWorkspace(agentId: string, requestedPath: string) {
  const file = safePath(agentId, requestedPath);
  return fs.readFile(file, 'utf8');
}

export async function writeFileInWorkspace(agentId: string, requestedPath: string, content: string) {
  const file = safePath(agentId, requestedPath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
  return file;
}

export async function editFileInWorkspace(agentId: string, requestedPath: string, content: string) {
  const file = safePath(agentId, requestedPath);
  let oldContent: string | null = null;
  try {
    oldContent = await fs.readFile(file, 'utf8');
  } catch {
    // file doesn't exist yet
  }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
  return { file, oldContent, newContent: content };
}
