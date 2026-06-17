'use client';

export default function MissionsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold text-white mb-6">Missions</h1>
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-red-300 mb-3">Something went wrong</p>
        <p className="text-xs text-zinc-500 mb-4">{error.message}</p>
        <button onClick={reset} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">
          Try again
        </button>
      </div>
    </main>
  );
}
