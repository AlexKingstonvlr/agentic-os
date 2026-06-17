'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AgentSidebar } from '@/components/AgentSidebar';
import { MemoryEditor } from '@/components/MemoryEditor';
import type { AgentProfile } from '@/lib/types';

interface MemoryFile {
  name: string;
  path: string;
  preview: string;
}

export default function MemoryPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);

  function loadFiles() {
    setLoading(true);
    setError(null);
    fetch('/api/memory')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => setFiles(data))
      .catch(() => setError('Error loading memory files'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFiles();
    fetch('/api/agents')
      .then((res) => res.json())
      .then((data) => setAgents(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) {
      setContent(null);
      return;
    }
    fetch(`/api/memory/${encodeURIComponent(selected)}`)
      .then((res) => res.json())
      .then((data) => setContent(data.content))
      .catch(() => setContent(null));
  }, [selected]);

  return (
    <main className="min-h-screen">
      <AgentSidebar agents={agents} selectedAgentId={agentId} />
      <section className="ml-0 md:ml-72 min-h-screen border-l border-white/10 bg-black/20 p-4 md:p-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">
            {agentId} · Memory
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Memory</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)] min-h-[500px]">
          <div className="w-full lg:w-80 flex-shrink-0 bg-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-medium text-zinc-300">Files</h2>
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-52px)]">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-zinc-500 animate-pulse">
                    Loading memory files...
                  </p>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={loadFiles}
                    className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && files.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center">
                    <p className="text-sm text-zinc-500">
                      No memory files found
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && files.length > 0 && (
                <div className="space-y-1">
                  {files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelected(file.path)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                        selected === file.path
                          ? 'bg-cyan-400/10 border border-cyan-400/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <p className="font-medium text-zinc-200">{file.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500 truncate">
                        {file.preview}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {content !== null && selected && (
              <MemoryEditor
                fileName={selected}
                content={content}
                onSave={(newContent) => setContent(newContent)}
              />
            )}
            {!selected && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-zinc-500">
                  Select a memory file to view
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
