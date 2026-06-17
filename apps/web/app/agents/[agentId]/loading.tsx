import { ChatPanelSkeleton } from '@/components/LoadingSkeleton';

export default function AgentLoading() {
  return (
    <main className="min-h-screen">
      <section className="ml-0 md:ml-72 min-h-screen border-l border-white/10 bg-black/20 p-6">
        <ChatPanelSkeleton />
      </section>
    </main>
  );
}
