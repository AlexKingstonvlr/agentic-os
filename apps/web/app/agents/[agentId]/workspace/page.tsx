'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AgentSidebar } from '@/components/AgentSidebar';
import { FileTree } from '@/components/FileTree';
import { FileEditor } from '@/components/FileEditor';
import type { AgentProfile } from '@/lib/types';

export default function WorkspacePage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [treeKey, setTreeKey] = useState(0);

  useEffect(() => {
    setAgentsLoading(true);
    setAgentsError(null);
    fetch('/api/agents')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => setAgents(data))
      .catch(() => setAgentsError('Error loading agents'))
      .finally(() => setAgentsLoading(false));
  }, []);

  useEffect(() => {
    setTreeKey((k) => k + 1);
  }, [agentId]);

  return (
    <main className="min-h-screen">
      <AgentSidebar agents={agents} selectedAgentId={agentId} />
      <section className="ml-0 md:ml-72 min-h-screen border-l border-white/10 bg-black/20 p-4 md:p-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">{agentId} · Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">File Workspace</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)] min-h-[500px]">
          <div className="w-full lg:w-80 flex-shrink-0 bg-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-medium text-zinc-300">Files</h2>
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-52px)]">
              <FileTree
                key={treeKey}
                agentId={agentId}
                onFileSelect={setSelectedFile}
                selectedPath={selectedFile}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <FileEditor agentId={agentId} filePath={selectedFile} />
          </div>
        </div>
      </section>
    </main>
  );
}