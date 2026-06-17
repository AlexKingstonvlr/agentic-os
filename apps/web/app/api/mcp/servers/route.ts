import { NextResponse } from 'next/server';
import { listServers, addServer, removeServer, getServer, testAndAddServer } from '@/lib/mcp/registry';

export async function GET() {
  try {
    const servers = await listServers();
    return NextResponse.json(servers);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list servers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string;
      url?: string;
      description?: string;
    };

    if (!body.name || !body.url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    const existing = await getServer(body.name);
    if (existing) {
      return NextResponse.json(
        { error: `MCP server "${body.name}" already exists` },
        { status: 409 }
      );
    }

    const config = {
      name: body.name,
      url: body.url,
      description: body.description ?? '',
      addedAt: new Date().toISOString()
    };

    const testResult = await testAndAddServer(config);
    if (!testResult.ok) {
      return NextResponse.json(
        { error: testResult.error ?? 'Connection test failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) {
      return NextResponse.json(
        { error: 'Name query parameter is required' },
        { status: 400 }
      );
    }

    await removeServer(name);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove server' },
      { status: 500 }
    );
  }
}
