'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { AgentProfile } from '@/lib/types';
import { ThemeToggle } from './ThemeToggle';

export function AgentSidebar({
  agents,
  selectedAgentId
}: {
  agents: AgentProfile[];
  selectedAgentId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isGoalPage = pathname.endsWith('/goal');

  const sidebar = (
    <aside className={`fixed inset-y-0 left-0 z-20 w-72 border-r border-white/10 bg-black/40 p-5 backdrop-blur-xl flex flex-col ${open ? 'flex' : 'hidden'} md:flex`}>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Local · Bangkok</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Agentic OS</h2>
      </div>

      <section>
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-500">Workspace</p>
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
        >
          <span>⊞</span>
          Mission Control
        </Link>
        <Link
          href="/control-room"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
        >
          <span>⬡</span>
          Control Room
        </Link>
        <Link
          href="/skills"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
        >
          <span>⚙</span>
          Skills
        </Link>
        <Link
          href={`/agents/${selectedAgentId}/memory`}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
        >
          <span>🧠</span>
          Memory
        </Link>
      </section>

      <section className="mt-8">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-500">Orchestration</p>
        <Link
          href="/missions"
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
            pathname.startsWith('/missions') ? 'bg-cyan-400/10 text-cyan-200' : 'text-zinc-300 hover:bg-white/5'
          }`}
        >
          <span>🎯</span>
          Missions
        </Link>
      </section>

      <section className="mt-8 flex-1 overflow-y-auto">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-500">Agents</p>
        <div className="space-y-1">
          {agents.map((agent) => (
            <div key={agent.id}>
              <button
                onClick={() => {
                  router.push(`/agents/${agent.id}`);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${
                  selectedAgentId === agent.id && !isGoalPage ? 'bg-cyan-400/10 text-cyan-200' : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[10px]">
                  {agent.icon}
                </span>
                <span>{agent.name}</span>
              </button>
              {selectedAgentId === agent.id && (
                <>
                  <button
                    onClick={() => {
                      router.push(`/agents/${agent.id}/goal`);
                      setOpen(false);
                    }}
                    className={`ml-9 flex w-[calc(100%-2.25rem)] items-center gap-2 rounded-xl px-3 py-1.5 text-left text-xs ${
                      isGoalPage ? 'bg-cyan-400/10 text-cyan-200' : 'text-zinc-400 hover:bg-white/5'
                    }`}
                  >
                    <span>🎯</span>
                    Goal Mode
                  </button>
                  <Link
                    href={`/agents/${agent.id}/approvals`}
                    onClick={() => setOpen(false)}
                    className={`ml-9 flex w-[calc(100%-2.25rem)] items-center gap-2 rounded-xl px-3 py-1.5 text-left text-xs ${
                      pathname.endsWith('/approvals') ? 'bg-cyan-400/10 text-cyan-200' : 'text-zinc-400 hover:bg-white/5'
                    }`}
                  >
                    <span>⏸️</span>
                    Approvals
                  </Link>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="hidden md:flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg bg-white/[0.02]">
          <span className="text-[10px] uppercase tracking-wider text-zinc-600">Toggle</span>
          <kbd className="ml-auto text-[10px] text-zinc-500 border border-white/10 rounded px-1.5 py-0.5">⌘⇧K</kbd>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-30 md:hidden rounded-xl border border-white/10 bg-black/60 p-2 text-white text-sm"
        title="Toggle sidebar (⌘⇧K)"
      >
        {open ? '✕' : '☰'}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      {sidebar}
    </>
  );
}
