import { getAgents } from '@/lib/agents';
import { AgentSidebar } from '@/components/AgentSidebar';
import { ChatPanel } from '@/components/ChatPanel';
import { ChatPanelSkeleton } from '@/components/LoadingSkeleton';
import OnboardingOverlay from '@/components/OnboardingOverlay';

export default async function Home() {
  const agents = await getAgents();
  const firstAgent = agents[0];

  return (
    <main className="min-h-screen">
      <AgentSidebar agents={agents} selectedAgentId={firstAgent?.id ?? 'claude'} />
      <section className="ml-0 md:ml-72 min-h-screen border-l border-white/10 bg-black/20 p-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Local · Bangkok</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">Agentic OS</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
            Mission Control for local AI agents. Start with Chat, then enable Goal Mode,
            Workspace, Skills, Memory, and Control Room.
          </p>
          {firstAgent ? <ChatPanel agent={firstAgent} /> : <ChatPanelSkeleton />}
        </div>
      </section>
      <OnboardingOverlay />
    </main>
  );
}
