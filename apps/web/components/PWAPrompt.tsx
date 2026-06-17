'use client';

import { useEffect, useState } from 'react';

export function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsTouch('ontouchstart' in window);

    const stored = localStorage.getItem('pwa-prompt-dismissed');
    if (stored) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function handleInstall() {
    if (!deferredPrompt) return;
    (deferredPrompt as unknown as { prompt: () => Promise<void> }).prompt();
    setDeferredPrompt(null);
    setDismissed(true);
  }

  function handleDismiss() {
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    setDismissed(true);
  }

  if (dismissed || !isTouch) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md">
      <p className="text-sm font-medium text-white">Install Agentic OS on your device</p>
      <p className="mt-1 text-xs text-zinc-400">Add to your home screen for quick access</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-200"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
