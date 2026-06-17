import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface McpClientInstance {
  client: Client;
  transport: StreamableHTTPClientTransport;
  serverName: string;
  serverUrl: string;
  capabilities: {
    tools: Array<{
      name: string;
      description?: string;
      inputSchema?: Record<string, unknown>;
    }>;
  } | null;
}

const connections = new Map<string, McpClientInstance>();

export async function connectToServer(name: string, url: string): Promise<McpClientInstance> {
  const existing = connections.get(name);
  if (existing) {
    await disconnectFromServer(name);
  }

  const transport = new StreamableHTTPClientTransport(new URL(url));
  const client = new Client(
    { name: 'agentic-os-client', version: '0.1.0' },
    { capabilities: {} }
  );

  await client.connect(transport);

  const instance: McpClientInstance = {
    client,
    transport,
    serverName: name,
    serverUrl: url,
    capabilities: null
  };

  connections.set(name, instance);
  return instance;
}

export async function disconnectFromServer(name: string): Promise<void> {
  const instance = connections.get(name);
  if (instance) {
    try {
      await instance.client.close();
    } catch {
    }
    connections.delete(name);
  }
}

type ToolsArray = NonNullable<McpClientInstance['capabilities']>['tools'];

export async function listServerTools(name: string): Promise<ToolsArray> {
  const instance = connections.get(name);
  if (!instance) throw new Error(`Not connected to MCP server: ${name}`);

  const result = await instance.client.listTools();
  const tools = (result.tools ?? []).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema as Record<string, unknown> | undefined
  }));

  instance.capabilities = { tools };
  return tools;
}

export async function callServerTool(
  name: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const instance = connections.get(name);
  if (!instance) throw new Error(`Not connected to MCP server: ${name}`);

  const result = await instance.client.callTool({ name: toolName, arguments: args });
  return result;
}

export function getConnection(name: string): McpClientInstance | undefined {
  return connections.get(name);
}

export function getAllConnections(): Map<string, McpClientInstance> {
  return connections;
}

export async function testConnection(url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const transport = new StreamableHTTPClientTransport(new URL(url));
    const client = new Client(
      { name: 'agentic-os-test', version: '0.1.0' },
      { capabilities: {} }
    );
    await client.connect(transport);
    await client.close();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
