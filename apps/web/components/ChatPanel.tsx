'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import type { AgentProfile } from '@/lib/types';

export function ChatPanel({ agent }: { agent: AgentProfile }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);
    setMessages((current) => [...current, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/openrouter/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          messages: [...messages, { role: 'user', content: userMessage }]
        })
      });

      const data = await response.json();
      setMessages((current) => [...current, { role: 'assistant', content: data.content ?? data.error ?? '' }]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: 'Request failed.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">{agent.id} · {agent.model}</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">{agent.name}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{agent.description}</p>
      </div>

      <div className="min-h-[320px] p-5">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm leading-6 text-zinc-500">
            Ask {agent.name} to plan, write, review, research, or automate a task.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((item, index) => (
              <div key={index} className={`rounded-2xl p-4 text-sm leading-6 ${item.role === 'user' ? 'bg-cyan-400/10 text-cyan-50' : 'bg-white/5 text-zinc-300'}`}>
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-zinc-500">{item.role}</p>
                <p className="whitespace-pre-wrap">{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-white/10 p-4">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={`Message ${agent.name}... (Ctrl+K to focus)`}
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/60"
          />
          <button
            disabled={loading}
            className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-medium text-black disabled:opacity-50"
          >
            {loading ? 'Thinking' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
