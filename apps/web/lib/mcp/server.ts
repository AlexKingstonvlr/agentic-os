import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod/v3';
import { runTool } from '@/lib/tools';

const SERVER_INFO = {
  name: 'agentic-os',
  version: '0.1.0'
};

export function createMcpServer(): McpServer {
  const server = new McpServer(SERVER_INFO, {
    capabilities: {
      tools: {}
    }
  });

  server.tool(
    'list_files',
    'List files in the current agent workspace.',
    {},
    async () => {
      const result = await runTool('default', 'list_files', {});
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'read_file',
    'Read a file from the current agent workspace.',
    { path: z.string() },
    async ({ path }) => {
      const result = await runTool('default', 'read_file', { path });
      return { content: [{ type: 'text' as const, text: String(result) }] };
    }
  );

  server.tool(
    'write_file',
    'Write a file inside the current agent workspace.',
    { path: z.string(), content: z.string() },
    async ({ path, content }) => {
      const result = await runTool('default', 'write_file', { path, content });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'edit_file',
    'Edit a file in the agent workspace (replaces whole content).',
    { path: z.string(), content: z.string() },
    async ({ path, content }) => {
      const result = await runTool('default', 'edit_file', { path, content });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    'run_tests',
    'Run bun test in the agent workspace directory.',
    {},
    async () => {
      const result = await runTool('default', 'run_tests', {});
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  );

  return server;
}

export async function startStdioServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
