'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AggregatedUsage {
  totalTokens: number;
  totalCost: number;
  totalSessions: number;
  totalCalls: number;
  promptTokens: number;
  completionTokens: number;
}

interface AgentUsageSummary {
  agentId: string;
  model: string;
  totalTokens: number;
  totalCost: number;
  totalCalls: number;
}

interface DailyUsage {
  date: string;
  totalTokens: number;
  totalCost: number;
}

interface SessionUsage {
  sessionId: string;
  agentId: string;
  model: string;
  totalTokens: number;
  totalCost: number;
  timestamp: string;
}

interface UsageSummary {
  overall: AggregatedUsage;
  byAgent: AgentUsageSummary[];
  byDay: DailyUsage[];
  bySession: SessionUsage[];
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

function getMaxToken(days: DailyUsage[]): number {
  return Math.max(...days.map((d) => d.totalTokens), 1);
}

export default function UsagePage() {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/usage?days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load usage data');
        return res.json() as Promise<UsageSummary>;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
          <p className="mt-4 text-sm text-zinc-500">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!data || data.overall.totalCalls === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-semibold text-white">Usage & Cost</h1>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-lg text-zinc-300 mb-2">No usage data yet</p>
          <p className="text-sm text-zinc-500">
            Usage data will appear here once you start chatting with agents.
          </p>
        </div>
      </div>
    );
  }

  const { overall, byAgent, byDay, bySession } = data;
  const maxToken = getMaxToken(byDay);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Usage & Cost</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Total Tokens</p>
          <p className="text-2xl font-semibold text-white">{formatTokens(overall.totalTokens)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Total Cost</p>
          <p className="text-2xl font-semibold text-white">{formatCost(overall.totalCost)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Sessions</p>
          <p className="text-2xl font-semibold text-white">{overall.totalSessions}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Avg Cost / Session</p>
          <p className="text-2xl font-semibold text-white">
            {overall.totalSessions > 0
              ? formatCost(overall.totalCost / overall.totalSessions)
              : '$0'}
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-300">Tokens per Day</h2>
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {byDay.map((day) => {
            const height = (day.totalTokens / maxToken) * 100;
            return (
              <div
                key={day.date}
                className="group relative flex flex-1 flex-col items-center justify-end"
              >
                <div
                  className="w-full rounded-t-md bg-cyan-400/60 transition-all hover:bg-cyan-400/80"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <div className="mt-1 text-[10px] text-zinc-600">
                  {day.date.slice(5)}
                </div>
                <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200 shadow-lg group-hover:block whitespace-nowrap">
                  {day.date}: {formatTokens(day.totalTokens)} tokens ({formatCost(day.totalCost)})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-zinc-300">Per-Agent Breakdown</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Agent</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Model</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">Tokens</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">Cost</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {byAgent.map((agent) => (
                <tr key={`${agent.agentId}-${agent.model}`} className="border-b border-white/5 bg-white/[0.01] last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-zinc-200">{agent.agentId}</td>
                  <td className="px-4 py-3 text-zinc-400">{agent.model}</td>
                  <td className="px-4 py-3 text-right text-zinc-200">{formatTokens(agent.totalTokens)}</td>
                  <td className="px-4 py-3 text-right text-zinc-200">{formatCost(agent.totalCost)}</td>
                  <td className="px-4 py-3 text-right text-zinc-200">
                    {overall.totalCost > 0
                      ? `${((agent.totalCost / overall.totalCost) * 100).toFixed(1)}%`
                      : '0%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-zinc-300">Per-Session Breakdown</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Session</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Agent</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">Tokens</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">Cost</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {bySession.map((s) => (
                <tr key={s.sessionId} className="border-b border-white/5 bg-white/[0.01] last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/sessions/${s.sessionId}`}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline"
                    >
                      {s.sessionId.slice(0, 24)}...
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-200">{s.agentId}</td>
                  <td className="px-4 py-3 text-right text-zinc-200">{formatTokens(s.totalTokens)}</td>
                  <td className="px-4 py-3 text-right text-zinc-200">{formatCost(s.totalCost)}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">
                    {new Date(s.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
