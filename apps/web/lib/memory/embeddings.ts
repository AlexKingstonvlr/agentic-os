import { getOpenRouterKey, getOpenRouterBaseUrl } from '@/lib/openrouter';

const OPENROUTER_MODEL = 'text-embedding-3-small';
const FALLBACK_DIM = 256;

function getFallbackEmbedding(text: string): number[] {
  const vector = new Array(FALLBACK_DIM).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const n = 3;

  for (let i = 0; i <= normalized.length - n; i++) {
    const gram = normalized.slice(i, i + n);
    let hash = 0;
    for (let j = 0; j < gram.length; j++) {
      hash = ((hash << 5) - hash) + gram.charCodeAt(j);
      hash |= 0;
    }
    vector[Math.abs(hash) % FALLBACK_DIM] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < FALLBACK_DIM; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

async function getOpenRouterEmbedding(text: string): Promise<number[]> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const res = await fetch(`${getOpenRouterBaseUrl()}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Agentic OS',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      input: text,
    }),
  });

  if (!res.ok) {
    const textBody = await res.text();
    throw new Error(`OpenRouter embeddings request failed: ${res.status} ${textBody}`);
  }

  const data = await res.json() as { data?: Array<{ embedding?: number[] }> };
  if (!data.data?.[0]?.embedding) {
    throw new Error('Invalid embeddings response');
  }
  return data.data[0].embedding;
}

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    return await getOpenRouterEmbedding(text);
  } catch {
    return getFallbackEmbedding(text);
  }
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await getEmbedding(text));
  }
  return results;
}
