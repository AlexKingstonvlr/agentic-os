import { NextResponse } from 'next/server';
import type { ChatMessage } from '@/lib/types';
import { createSession, addMessage, getMessages } from '@/lib/db/sessions';
import { addEvent } from '@/lib/db/events';
import { getAgent } from '@/lib/agents';
import { buildSystemMessage, callOpenRouter } from '@/lib/openrouter';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      agentId?: string;
      messages?: Array<Pick<ChatMessage, 'role' | 'content'>>;
    };

    const agentId = body.agentId ?? 'claude';
    const agent = await getAgent(agentId);
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    // Create a DB-backed session
    const sessionId = await createSession(agentId, 'chat');

    // Build the full message list (system prompt + incoming user messages)
    const incomingMessages = body.messages ?? [];
    const fullMessages = [
      buildSystemMessage(agent.systemPrompt),
      ...incomingMessages.map((m) => ({ role: m.role, content: m.content }))
    ];

    // Persist system + user messages
    for (const msg of fullMessages) {
      await addMessage(sessionId, msg.role, msg.content);
    }

    // Fire agent.started event
    await addEvent(sessionId, 'agent.started', { agentId });

    // Call OpenRouter
    const content = await callOpenRouter({ messages: fullMessages, model: agent.model });

    // Persist assistant reply
    await addMessage(sessionId, 'assistant', content);
    await addEvent(sessionId, 'agent.message', { agentId, role: 'assistant', content });

    return NextResponse.json({
      sessionId,
      agentId,
      content,
      messages: await getMessages(sessionId)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}

