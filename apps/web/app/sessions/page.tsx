import Link from 'next/link';
import { listSessions } from '@/lib/db/sessions';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const allSessions = await listSessions();

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-white mb-2">Session Replay</h1>
        <p className="text-sm text-zinc-500 mb-8">Browse past agent sessions and replay their action timeline.</p>

        {allSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
            No sessions yet. Start a conversation with an agent to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {allSessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">{session.agent_id}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 font-mono">{session.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      session.status === 'running'
                        ? 'border-green-500/30 text-green-300 bg-green-500/10'
                        : session.status === 'failed'
                        ? 'border-red-500/30 text-red-300 bg-red-500/10'
                        : 'border-zinc-500/30 text-zinc-400 bg-zinc-500/10'
                    }`}>
                      {session.status}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(session.created_at).toLocaleDateString()} {new Date(session.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
