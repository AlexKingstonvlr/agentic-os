'use client';

import { useEffect, useState } from 'react';
import EmptyState from '@/components/EmptyState';

interface Skill {
  name: string;
  description: string;
  source: string;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/skills')
      .then((r) => r.json())
      .then(setSkills)
      .catch(() => setSkills([]));
  }, []);

  useEffect(() => {
    if (!selected) { setContent(null); return; }
    fetch(`/api/skills?name=${encodeURIComponent(selected)}`)
      .then((r) => r.text())
      .then(setContent);
  }, [selected]);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-white mb-6">Skills</h1>
      {skills.length === 0 ? (
        <EmptyState
          icon="⚙"
          title="No skills yet"
          description="Skills define what agents can do. Add skills to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <button
              key={skill.source}
              onClick={() => setSelected(skill.source)}
              className={`rounded-xl border p-4 text-left text-sm ${
                selected === skill.source ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="font-medium text-white truncate">{skill.name}</p>
              <p className="mt-1 text-zinc-400 line-clamp-2">{skill.description}</p>
            </button>
          ))}
        </div>
      )}
      {content && (
        <pre className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300 overflow-auto whitespace-pre-wrap max-h-[60vh]">
          {content}
        </pre>
      )}
    </main>
  );
}
