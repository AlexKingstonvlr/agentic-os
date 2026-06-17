'use client';

import { useEffect, useState } from 'react';
import type { AgentCard } from '@/lib/a2a/types';

interface Task {
  id: string;
  requester: string;
  target: string;
  type: string;
  input: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: any;
  createdAt: string;
  completedAt?: string;
}

export default function A2APage() {
  const [localCards, setLocalCards] = useState<Record<string, AgentCard>>({});
  const [remoteCards, setRemoteCards] = useState<Record<string, AgentCard>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [discoverUrl, setDiscoverUrl] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoverMsg, setDiscoverMsg] = useState('');
  const [taskTarget, setTaskTarget] = useState('');
  const [taskType, setTaskType] = useState('message');
  const [taskInput, setTaskInput] = useState('');
  const [taskUrl, setTaskUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadRegistry() {
    const [agentsRes, discoverRes] = await Promise.all([
      fetch('/api/agents'),
      fetch('/api/a2a/discover'),
    ]);
    if (agentsRes.ok) {
      const agents = await agentsRes.json() as Array<{ id: string; name: string; description: string; skills: string[] }>;
      const cards: Record<string, AgentCard> = {};
      for (const a of agents) {
        cards[a.id] = {
          name: a.name,
          description: a.description,
          url: '',
          capabilities: a.skills.map(s => s as any),
          skills: a.skills,
        };
      }
      setLocalCards(cards);
    }
    if (discoverRes.ok) {
      const data = await discoverRes.json();
      setRemoteCards(data.remote ?? {});
    }
  }

  useEffect(() => {
    async function init() {
      try {
        await fetch('/api/a2a/agent-card');
        await loadRegistry();
        const tasksRes = await fetch('/api/a2a/tasks');
        if (tasksRes.ok) setTasks(await tasksRes.json());
      } catch {
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleDiscover() {
    if (!discoverUrl.trim()) return;
    setDiscovering(true);
    setDiscoverMsg('');
    try {
      const res = await fetch('/api/a2a/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: discoverUrl.trim() }),
      });
      if (res.ok) {
        setDiscoverMsg('Agent discovered successfully');
        setDiscoverUrl('');
        await loadRegistry();
      } else {
        const err = await res.json();
        setDiscoverMsg(err.error ?? 'Discovery failed');
      }
    } catch {
      setDiscoverMsg('Discovery failed');
    } finally {
      setDiscovering(false);
    }
  }

  async function handleSubmitTask() {
    if (!taskTarget || !taskInput.trim()) return;
    setSubmitting(true);
    try {
      const body: Record<string, any> = { targetAgentId: taskTarget, type: taskType, input: taskInput };
      if (taskUrl.trim()) body.targetUrl = taskUrl.trim();
      const res = await fetch('/api/a2a/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [newTask, ...prev]);
        setTaskInput('');
        setTaskUrl('');
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10',
      running: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
      completed: 'border-green-500/30 text-green-300 bg-green-500/10',
      failed: 'border-red-500/30 text-red-300 bg-red-500/10',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] ?? 'border-zinc-500/30 text-zinc-400 bg-zinc-500/10'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <h1 className="text-2xl font-semibold text-white mb-6">A2A Protocol</h1>
          <div className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
            <div className="h-4 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">A2A Protocol</h1>
          <p className="text-sm text-zinc-500 mt-1">Agent-to-Agent discovery and task delegation</p>
        </div>

        <section>
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">Registered Agents</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            {Object.keys(localCards).length === 0 && Object.keys(remoteCards).length === 0 ? (
              <p className="text-sm text-zinc-500">No agents registered yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(localCards).map(([id, card]) => (
                  <div key={id} className="flex items-start justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="text-sm font-medium text-white">{card.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{card.description}</p>
                      <div className="flex gap-1.5 mt-2">
                        {card.capabilities.map(c => (
                          <span key={c} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-zinc-400">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">local</span>
                  </div>
                ))}
                {Object.entries(remoteCards).map(([url, card]) => (
                  <div key={url} className="flex items-start justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="text-sm font-medium text-white">{card.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{card.description}</p>
                      <p className="text-[10px] text-zinc-600 mt-1 font-mono truncate max-w-xs">{url}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">remote</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">Discover Agent</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={discoverUrl}
                onChange={e => setDiscoverUrl(e.target.value)}
                placeholder="https://example.com/api/a2a/agent-card"
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600"
              />
              <button
                onClick={handleDiscover}
                disabled={discovering || !discoverUrl.trim()}
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
              >
                {discovering ? 'Discovering...' : 'Discover'}
              </button>
            </div>
            {discoverMsg && (
              <p className={`text-xs mt-2 ${discoverMsg.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                {discoverMsg}
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">Delegate Task</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <input
              type="text"
              value={taskTarget}
              onChange={e => setTaskTarget(e.target.value)}
              placeholder="Target agent ID (e.g. antigravity)"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600"
            />
            <input
              type="url"
              value={taskUrl}
              onChange={e => setTaskUrl(e.target.value)}
              placeholder="Remote URL (optional, for delegation)"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600"
            />
            <select
              value={taskType}
              onChange={e => setTaskType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-zinc-300 outline-none"
            >
              <option value="message">Message</option>
              <option value="tool">Tool</option>
              <option value="research">Research</option>
              <option value="code-review">Code Review</option>
            </select>
            <textarea
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              placeholder="Task input (JSON or plain text)"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600 resize-none"
            />
            <button
              onClick={handleSubmitTask}
              disabled={submitting || !taskTarget || !taskInput.trim()}
              className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit Task'}
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">Task History</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            {tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
                No tasks yet. Delegate a task to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-start justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{task.target}</span>
                        {statusBadge(task.status)}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 truncate">
                        {typeof task.input === 'string' ? task.input : JSON.stringify(task.input)}
                      </p>
                      {task.output && (
                        <p className="text-xs text-zinc-400 mt-1 truncate">
                          → {typeof task.output === 'string' ? task.output : JSON.stringify(task.output)}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                      {new Date(task.createdAt).toLocaleDateString()} {new Date(task.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
