'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Mission, Task } from '@/lib/missions';

const COLUMNS: { key: Task['status']; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

function SkeletonColumn() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 animate-pulse">
      <div className="h-5 w-24 bg-white/10 rounded mb-4" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 bg-white/5 rounded-lg mb-2" />
      ))}
    </div>
  );
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/missions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMissions(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Missions</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonColumn />
          <SkeletonColumn />
          <SkeletonColumn />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Missions</h1>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-red-300 mb-3">Failed to load missions: {error}</p>
          <button onClick={fetchMissions} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (missions.length === 0) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Missions</h1>
        <div className="rounded-xl border-2 border-dashed border-white/10 p-12 text-center">
          <p className="text-zinc-500">No missions yet. Create one above.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold text-white mb-6">Missions</h1>
      <div className="space-y-6">
        {missions.map((mission) => (
          <section key={mission.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-white">{mission.title}</h2>
                <p className="text-sm text-zinc-400">{mission.goal}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                mission.status === 'active' ? 'bg-green-500/10 text-green-300' :
                mission.status === 'paused' ? 'bg-yellow-500/10 text-yellow-300' :
                'bg-zinc-500/10 text-zinc-400'
              }`}>
                {mission.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {COLUMNS.map((col) => {
                const tasks = mission.tasks.filter((t) => t.status === col.key);
                return (
                  <div key={col.key} className="rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{col.label}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-500">{tasks.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {tasks.map((task) => (
                        <div key={task.id} className="rounded-lg border border-white/5 bg-white/5 p-2.5 text-sm">
                          <p className="text-zinc-300">{task.title}</p>
                          <p className="text-xs text-zinc-500 mt-1">{task.assignedAgentId}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
