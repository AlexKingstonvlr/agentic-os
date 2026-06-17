'use client';

export default function AgentError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6">
      <div className="max-w-md text-center">
        <span className="text-5xl">⚠️</span>
        <h1 className="mt-4 text-2xl font-semibold text-white">Agent page error</h1>
        <p className="mt-2 text-sm text-red-400">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-cyan-300 px-5 py-2 text-sm font-medium text-black"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
