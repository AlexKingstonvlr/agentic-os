'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'agentic-os-onboarded';

const steps = [
  {
    title: 'Sidebar',
    description: 'Select an agent from the sidebar to start chatting.'
  },
  {
    title: 'Chat',
    description: 'Type your message and press Send. Agents respond through OpenRouter.'
  },
  {
    title: 'Workspace',
    description: 'Each agent has its own workspace for files and code.'
  }
];

export default function OnboardingOverlay() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem(STORAGE_KEY);
    if (!onboarded) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  }

  function next() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="rounded-3xl border border-white/10 bg-black/60 p-8 max-w-md w-full mx-4">
        <span className="text-4xl">
          {step === 0 ? '📋' : step === 1 ? '💬' : '📁'}
        </span>
        <h2 className="mt-4 text-xl font-semibold text-white">{current.title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{current.description}</p>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full ${
                  i === step ? 'bg-cyan-300' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="rounded-xl bg-cyan-300 px-5 py-2 text-sm font-medium text-black"
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
