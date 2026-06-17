'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AgentSidebar } from '@/components/AgentSidebar';
import EmptyState from '@/components/EmptyState';
import type { AgentProfile } from '@/lib/types';

interface Checkpoint {
  id: string;
  sessionId: string;
  agentId: string;
  actionType: string;
  data: Record<string, unknown>;
  status: string;
  toolIndex: number;
  createdAt: string;
}

export default function ApprovalsPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [modifyingId, setModifyingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<string>('');
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [agents, setAgents] = useState<AgentProfile[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/agents');
        const all: AgentProfile[] = await res.json();
        setAgents(all);
        const found = all.find((a) => a.id === agentId);
        if (found) setAgent(found);
      } catch {
      }
    }
    init();
  }, [agentId]);

  const fetchCheckpoints = useCallback(async () => {
    try {
      const res = await fetch(`/api/checkpoints?agentId=${encodeURIComponent(agentId)}&status=pending`);
      const data = await res.json();
      setCheckpoints(data.checkpoints ?? []);
    } catch {
      setCheckpoints([]);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchCheckpoints();
    const interval = setInterval(fetchCheckpoints, 5000);
    return () => clearInterval(interval);
  }, [fetchCheckpoints]);

  async function handleApprove(id: string, modifications?: Record<string, unknown>) {
    setResolving(id);
    try {
      await fetch('/api/checkpoints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve', modifications }),
      });
      setCheckpoints((prev) => prev.filter((cp) => cp.id !== id));
    } catch {
    } finally {
      setResolving(null);
      setModifyingId(null);
    }
  }

  async function handleReject(id: string) {
    setResolving(id);
    try {
      await fetch('/api/checkpoints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject' }),
      });
      setCheckpoints((prev) => prev.filter((cp) => cp.id !== id));
    } catch {
    } finally {
      setResolving(null);
    }
  }

  function openModify(cp: Checkpoint) {
    setModifyingId(cp.id);
    setEditData(JSON.stringify(cp.data, null, 2));
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        {agents.length > 0 && (
          <AgentSidebar agents={agents} selectedAgentId={agentId} />
        )}
        <section className="ml-0 md:ml-72 min-h-screen border-l border-white/10 bg-black/20 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-white/5" />
            <div className="h-4 w-64 rounded bg-white/5" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-white/5" />
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {agents.length > 0 && (
        <AgentSidebar agents={agents} selectedAgentId={agent?.id ?? agentId} />
      )}
      <section className="ml-0 md:ml-72 min-h-screen border-l border-white/10 bg-black/20 p-6">
        <h1 className="text-2xl font-semibold text-white">Approvals</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {agent?.name ?? agentId} · {checkpoints.length} pending
        </p>

        {checkpoints.length === 0 ? (
          <EmptyState
            icon="⏸️"
            title="No pending approvals"
            description="All pending checkpoints will appear here for manual review."
          />
        ) : (
          <div className="mt-6 space-y-4">
            {checkpoints.map((cp) => (
              <div
                key={cp.id}
                className="rounded-xl border border-white/10 bg-black/30 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-md bg-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                      {cp.actionType}
                    </span>
                    <p className="mt-2 text-xs text-zinc-500">
                      {new Date(cp.createdAt).toLocaleString()}
                    </p>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-zinc-300">
                      {JSON.stringify(cp.data, null, 2)}
                    </pre>
                  </div>
                </div>

                {modifyingId === cp.id ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={editData}
                      onChange={(e) => setEditData(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-cyan-300/60 font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(editData);
                            handleApprove(cp.id, parsed);
                          } catch {
                            alert('Invalid JSON');
                          }
                        }}
                        disabled={resolving === cp.id}
                        className="rounded-lg bg-cyan-300 px-4 py-1.5 text-xs font-medium text-black disabled:opacity-50"
                      >
                        {resolving === cp.id ? 'Approving...' : 'Approve with edits'}
                      </button>
                      <button
                        onClick={() => setModifyingId(null)}
                        className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleApprove(cp.id)}
                      disabled={resolving === cp.id}
                      className="rounded-lg bg-emerald-500/20 px-4 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                      {resolving === cp.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => openModify(cp)}
                      className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-zinc-400 hover:text-white"
                    >
                      Modify
                    </button>
                    <button
                      onClick={() => handleReject(cp.id)}
                      disabled={resolving === cp.id}
                      className="rounded-lg bg-red-500/20 px-4 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {resolving === cp.id ? '...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
