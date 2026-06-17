import type { ChatMessage } from './types';

export function getOpenRouterKey() {
  return process.env.OPENROUTER_API_KEY;
}

export function getOpenRouterBaseUrl() {
  return process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
}

export function buildSystemMessage(systemPrompt: string) {
  return {
    role: 'system' as const,
    content: systemPrompt
  };
}

export async function callOpenRouter({
  messages,
  model,
  signal
}: {
  messages: ChatMessage[];
  model: string;
  signal?: AbortSignal;
}) {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const response = await fetch(`${getOpenRouterBaseUrl()}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Agentic OS'
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${text}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content ?? '';
}
