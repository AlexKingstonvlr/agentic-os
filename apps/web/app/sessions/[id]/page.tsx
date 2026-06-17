'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ReplayAction {
  id: number;
  sessionId: string;
  type: string;
  timestamp: string;
  data: unknown;
  parentId?: number;
}

const actionConfig: Record<string, { icon: string; color: string }> = {
  thought: { icon: '💭', color: 'text-purple-300' },
  tool_call: { icon: '🔧', color: 'text-yellow-300' },
  tool_result: { icon: '✅', color: 'text-green-300' },
  user_message: { icon: '👤', color: 'text-cyan-300' },
  assistant_message: { icon: '🤖', color: 'text-blue-300' },
  checkpoint: { icon: '⏸️', color: 'text-zinc-400' }
};

export default function SessionReplayPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [actions, setActions] = useState<ReplayAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const fetchReplay = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/replay`);
      if (!res.ok) {
        if (res.status === 404) setError('Session not found');
        return;
      }
      const data = await res.json();
      setActions(data.actions ?? []);
    } catch {
      setError('Failed to load replay');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchReplay();
  }, [fetchReplay]);

  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(fetchReplay, 2000);
    return () => clearInterval(interval);
  }, [liveMode, fetchReplay]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [actions]);

  if (error) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/sessions" className="text-sm text-cyan-300 hover:underline">&larr; Back to sessions</Link>
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Session Replay</h1>
            <p className="mt-1 text-xs text-zinc-500 font-mono">{sessionId}</p>
          </div>
          <button
            onClick={() => setLiveMode(!liveMode)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              liveMode
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {liveMode ? '● Live' : '○ Auto-refresh'}
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-zinc-500">
            Loading replay...
          </div>
        ) : actions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
            No actions recorded for this session.
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />
            <div className="space-y-3">
              {actions.map((action) => {
                const config = actionConfig[action.type] ?? { icon: '•', color: 'text-zinc-400' };
                const isExpanded = expandedId === action.id;
                return (
                  <div key={action.id} className="relative pl-12">
                    <div className={`absolute left-3 top-3.5 h-3 w-3 rounded-full border-2 border-black ${isExpanded ? 'bg-cyan-400' : 'bg-white/20'}`} />
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : action.id)}
                      className="w-full rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${config.color}`}>{config.icon}</span>
                        <span className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                          {action.type.replace(/_/g, ' ')}
                        </span>
                        <span className="ml-auto text-[10px] text-zinc-600">
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {isExpanded && (
                        <pre className="mt-3 rounded-xl bg-black/40 p-3 text-xs text-zinc-400 overflow-x-auto leading-5">
                          {JSON.stringify(action.data, null, 2)}
                        </pre>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <div ref={endRef} />
          </div>
        )}
      </div>
    </main>
  );
}
