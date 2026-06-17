'use client';

import { useEffect, useState, useCallback } from 'react';

interface AgentStatus {
  agentId: string;
  name: string;
  icon: string;
  status: 'running' | 'idle' | 'completed';
  lastActivity: string | null;
  currentTask: string | null;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-white/10" />
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
      <div className="h-3 w-32 bg-white/5 rounded mb-2" />
      <div className="h-3 w-20 bg-white/5 rounded" />
    </div>
  );
}

export function AgentStatusBoard() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
        <p className="text-red-300 text-sm mb-2">Failed to load agent status</p>
        <button onClick={fetchStatus} className="text-xs text-zinc-400 hover:text-zinc-300 underline">Retry</button>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center">
        <p className="text-zinc-500 text-sm">No agents found</p>
      </div>
    );
  }

  const statusColor = (s: AgentStatus['status']) => {
    switch (s) {
      case 'running': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'completed': return 'bg-zinc-500';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {agents.map((agent) => (
        <div key={agent.agentId} className="rounded-xl border border-white/10 bg-black/40 p-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-sm">
              {agent.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{agent.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`h-2 w-2 rounded-full ${statusColor(agent.status)}`} />
                <span className="text-xs text-zinc-500 capitalize">{agent.status}</span>
              </div>
            </div>
          </div>
          {agent.currentTask && (
            <p className="text-xs text-zinc-500 truncate">{agent.currentTask}</p>
          )}
          {agent.lastActivity && (
            <p className="text-xs text-zinc-600 mt-0.5">
              {new Date(agent.lastActivity).toLocaleString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
