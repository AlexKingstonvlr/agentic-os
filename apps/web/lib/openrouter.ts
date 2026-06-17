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

interface StreamCallbacks {
  onThought?: (text: string) => void;
  onToken?: (token: string) => void;
  onToolCall?: (call: { name: string; arguments: Record<string, unknown> }) => void;
}

export async function streamOpenRouter({
  messages,
  model,
  onThought,
  onToken,
  onToolCall,
}: {
  messages: ChatMessage[];
  model: string;
} & StreamCallbacks): Promise<string> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const response = await fetch(`${getOpenRouterBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Agentic OS',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter stream failed: ${response.status} ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;

      try {
        const parsed = JSON.parse(json);
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          fullContent += delta.content;
          onToken?.(delta.content);
        }

        if (delta.reasoning) {
          onThought?.(delta.reasoning);
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.function?.name) {
              onToolCall?.({ name: tc.function.name, arguments: {} });
            }
          }
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullContent;
}
