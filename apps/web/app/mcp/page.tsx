'use client';

import { useEffect, useState, useCallback } from 'react';

interface McpServerEntry {
  name: string;
  url: string;
  description: string;
  addedAt: string;
}

interface McpToolEntry {
  source: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export default function McpPage() {
  const [servers, setServers] = useState<McpServerEntry[]>([]);
  const [tools, setTools] = useState<McpToolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/servers');
      if (res.ok) {
        const data = await res.json();
        setServers(data);
      }
    } catch {
    }
  }, []);

  const fetchTools = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/tools');
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools ?? []);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchServers(), fetchTools()]).finally(() => setLoading(false));
  }, [fetchServers, fetchTools]);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), url: url.trim(), description: description.trim() })
      });
      if (res.ok) {
        setName('');
        setUrl('');
        setDescription('');
        await fetchServers();
        await fetchTools();
      } else {
        const err = await res.json();
        setError(err.error ?? 'Failed to add server');
      }
    } catch {
      setError('Failed to add server');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (serverName: string) => {
    try {
      const res = await fetch(`/api/mcp/servers?name=${encodeURIComponent(serverName)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchServers();
        await fetchTools();
      }
    } catch {
    }
  };

  const serverTools = (serverName: string) =>
    tools.filter((t) => t.source === serverName);

  const builtInTools = tools.filter((t) => t.source === 'built-in');

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-2xl">🔌</span>
          <h1 className="text-2xl font-semibold text-white">MCP Servers</h1>
        </div>

        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">Add Server</h2>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <input
              type="text"
              placeholder="Server name (e.g., my-server)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
            />
            <input
              type="url"
              placeholder="URL (e.g., http://localhost:3001/mcp)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleAdd}
              disabled={adding || !name.trim() || !url.trim()}
              className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-200"
            >
              {adding ? 'Connecting...' : 'Add Server'}
            </button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">
            Connected Servers ({servers.length})
          </h2>
          {loading ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-500">
              Loading...
            </div>
          ) : servers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
              <span className="text-4xl">📭</span>
              <h3 className="mt-4 text-lg font-semibold text-white">No MCP servers</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Add an MCP server above to connect external tools.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {servers.map((server) => {
                const sTools = serverTools(server.name);
                const isExpanded = expandedServer === server.name;
                return (
                  <div
                    key={server.name}
                    className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-green-400" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{server.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{server.url}</p>
                          {server.description && (
                            <p className="text-xs text-zinc-400 mt-0.5 truncate">{server.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setExpandedServer(isExpanded ? null : server.name)}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                          {isExpanded ? 'Hide' : `${sTools.length} tools`}
                        </button>
                        <button
                          onClick={() => handleRemove(server.name)}
                          className="rounded-lg border border-red-400/30 px-2.5 py-1 text-xs text-red-400 hover:bg-red-400/10"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 space-y-2">
                        {sTools.length === 0 ? (
                          <p className="text-xs text-zinc-500">Loading tools...</p>
                        ) : (
                          sTools.map((tool) => (
                            <div key={tool.name} className="rounded-lg bg-black/30 px-3 py-2">
                              <p className="text-sm font-medium text-zinc-200">{tool.name}</p>
                              {tool.description && (
                                <p className="text-xs text-zinc-500 mt-0.5">{tool.description}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">
            Built-in Tools ({builtInTools.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {builtInTools.map((tool) => (
              <div
                key={tool.name}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <p className="text-sm font-medium text-white">{tool.name}</p>
                {tool.description && (
                  <p className="text-xs text-zinc-500 mt-1">{tool.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
