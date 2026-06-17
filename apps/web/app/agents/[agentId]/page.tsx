import { notFound } from 'next/navigation';
import { getAgent, getAgents } from '@/lib/agents';
import { AgentSidebar } from '@/components/AgentSidebar';
import { ChatPanel } from '@/components/ChatPanel';

export default async function AgentPage({
  params
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await getAgent(agentId);
  if (!agent) notFound();

  const agents = await getAgents();

  return (
    <main className="min-h-screen">
      <AgentSidebar agents={agents} selectedAgentId={agent.id} />
      <section className="ml-0 md:ml-72 min-h-screen border-l border-white/10 bg-black/20 p-6">
        <ChatPanel agent={agent} />
      </section>
    </main>
  );
}
