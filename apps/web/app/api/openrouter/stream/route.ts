import { addEvent } from '@/lib/db/events';
import { createSession, addMessage } from '@/lib/db/sessions';
import { getAgent } from '@/lib/agents';
import { buildSystemMessage, streamOpenRouter } from '@/lib/openrouter';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      agentId?: string;
      messages?: Array<{ role: string; content: string }>;
      sessionId?: string;
    };

    const agentId = body.agentId ?? 'claude';
    const agent = await getAgent(agentId);
    if (!agent) {
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const incomingMessages = body.messages ?? [];
    const sessionId = body.sessionId ?? await createSession(agentId, 'chat');

    const fullMessages = [
      buildSystemMessage(agent.systemPrompt),
      ...incomingMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    ];

    for (const msg of fullMessages) {
      await addMessage(sessionId, msg.role, msg.content);
    }

    await addEvent(sessionId, 'agent.started', { agentId });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        function send(event: string, data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: event, ...data })}\n\n`));
        }

        try {
          const content = await streamOpenRouter({
            messages: fullMessages,
            model: agent.model,
            onThought: (thought) => {
              send('thought', { content: thought });
              addEvent(sessionId, 'agent.thought', { content: thought });
            },
            onToken: (token) => {
              send('token', { content: token });
            },
            onToolCall: (call) => {
              send('tool_call', { name: call.name, args: call.arguments });
              addEvent(sessionId, 'agent.tool_call', call);
            }
          });

          await addMessage(sessionId, 'assistant', content);
          await addEvent(sessionId, 'agent.message', { agentId, role: 'assistant', content });

          send('done', { content, sessionId });
        } catch (error) {
          send('error', { message: error instanceof Error ? error.message : 'Stream failed' });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Stream failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
