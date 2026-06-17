import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
          <svg className="h-10 w-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-white">You&apos;re offline</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Check your internet connection and try again. Cached data is still available.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-cyan-300 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-200"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
