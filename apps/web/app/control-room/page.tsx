'use client';

import { useEffect, useState } from 'react';

export default function ControlRoomPage() {
  const [logs, setLogs] = useState<string>('');
  const [agents, setAgents] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => setAgents(data.map((a: { id: string }) => a.id)))
      .catch(() => setAgents([]));

    fetch('/api/events')
      .then((r) => r.text())
      .then((text) => setLogs(text))
      .catch(() => setLogs('// Events API not yet available'));
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-white mb-6">Control Room</h1>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">Active Agents</h2>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          {agents.length === 0 ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : (
            <ul className="space-y-2">
              {agents.map((id) => (
                <li key={id} className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  {id}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">Logs</h2>
        <textarea
          value={logs}
          readOnly
          rows={20}
          className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-400 outline-none resize-none font-mono"
        />
      </section>
    </main>
  );
}
