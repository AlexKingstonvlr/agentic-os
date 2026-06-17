import { NextResponse } from 'next/server';
import { tools, runTool } from '@/lib/tools';
import { listServers } from '@/lib/mcp/registry';
import { connectToServer, listServerTools, callServerTool } from '@/lib/mcp/client';

export async function GET() {
  try {
    const builtInTools = tools.map((t) => ({
      source: 'built-in',
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }));

    const servers = await listServers();
    const mcpTools: Array<{
      source: string;
      name: string;
      description?: string;
      inputSchema?: Record<string, unknown>;
    }> = [];

    for (const server of servers) {
      try {
        await connectToServer(server.name, server.url);
        const serverTools = await listServerTools(server.name);
        for (const tool of serverTools) {
          mcpTools.push({
            source: server.name,
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          });
        }
      } catch {
      }
    }

    return NextResponse.json({ tools: [...builtInTools, ...mcpTools] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list tools' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      agentId?: string;
      serverName?: string;
      toolName?: string;
      args?: Record<string, unknown>;
    };

    if (!body.toolName) {
      return NextResponse.json({ error: 'toolName is required' }, { status: 400 });
    }

    const agentId = body.agentId ?? 'default';

    if (body.serverName) {
      const result = await callServerTool(body.serverName, body.toolName, body.args ?? {});
      return NextResponse.json({ result });
    }

    const result = await runTool(agentId, body.toolName, body.args ?? {});
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tool execution failed' },
      { status: 500 }
    );
  }
}
