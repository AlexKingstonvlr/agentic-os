import { execSync } from 'node:child_process';
import type { ToolDefinition } from '@/lib/types';
import { listWorkspaceFiles, readFileInWorkspace, writeFileInWorkspace, editFileInWorkspace } from '@/lib/workspace';
import { resolveProjectPath } from '@/lib/paths';

export const tools: ToolDefinition[] = [
  {
    name: 'list_files',
    description: 'List files in the current agent workspace.',
    inputSchema: {},
    permission: 'fileRead'
  },
  {
    name: 'read_file',
    description: 'Read a file from the current agent workspace.',
    inputSchema: { path: 'string' },
    permission: 'fileRead'
  },
  {
    name: 'write_file',
    description: 'Write a file inside the current agent workspace.',
    inputSchema: { path: 'string', content: 'string' },
    permission: 'fileWrite'
  },
  {
    name: 'edit_file',
    description: 'Edit a file in the agent workspace (replaces whole content). Returns old and new content.',
    inputSchema: { path: 'string', content: 'string' },
    permission: 'fileWrite'
  },
  {
    name: 'run_tests',
    description: 'Run bun test in the agent workspace directory.',
    inputSchema: {},
    permission: 'shell'
  }
];

export async function runTool(agentId: string, name: string, args: Record<string, unknown>) {
  if (name === 'list_files') return listWorkspaceFiles(agentId);
  if (name === 'read_file') return readFileInWorkspace(agentId, String(args.path ?? ''));
  if (name === 'write_file') return writeFileInWorkspace(agentId, String(args.path ?? ''), String(args.content ?? ''));
  if (name === 'edit_file') return editFileInWorkspace(agentId, String(args.path ?? ''), String(args.content ?? ''));
  if (name === 'run_tests') {
    const workspaceRoot = resolveProjectPath(process.env.WORKSPACE_ROOT ?? 'workspaces', agentId);
    try {
      const stdout = execSync('bun test', { cwd: workspaceRoot, timeout: 30000, encoding: 'utf8' });
      return { stdout };
    } catch (error: any) {
      return { stdout: error.stdout ?? '', stderr: error.stderr ?? String(error) };
    }
  }
  throw new Error(`Unknown tool: ${name}`);
}
