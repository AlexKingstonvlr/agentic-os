'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';

export default function GoalPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/goals?agentId=${encodeURIComponent(agentId)}`)
      .then((r) => r.json())
      .then((data) => setGoals(data.goals || []))
      .catch(() => setGoals([]))
      .finally(() => setPageLoading(false));
  }, [agentId]);

  async function startGoal() {
    if (!title.trim() || !prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, title, prompt })
      });
      if (!res.ok) return;
      router.push(`/agents/${agentId}`);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <main className="min-h-screen p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Goal Mode</h1>
        <p className="text-sm text-zinc-400 mb-6">Agent: {agentId}</p>
        <FormSkeleton />
      </main>
    );
  }

  if (goals.length === 0) {
    return (
      <main className="min-h-screen p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Goal Mode</h1>
        <p className="text-sm text-zinc-400 mb-6">Agent: {agentId}</p>
        <EmptyState
          icon="🎯"
          title="No goals yet"
          description="Create a goal to give your agent a long-running mission."
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-white mb-6">Goal Mode</h1>
      <p className="text-sm text-zinc-400 mb-6 break-words">Agent: {agentId}</p>
      <div className="max-w-xl space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Goal title"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/60"
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the goal..."
          rows={6}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/60 resize-none"
        />
        <button
          onClick={startGoal}
          disabled={loading || !title.trim() || !prompt.trim()}
          className="rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'Start Goal'}
        </button>
      </div>
    </main>
  );
}
