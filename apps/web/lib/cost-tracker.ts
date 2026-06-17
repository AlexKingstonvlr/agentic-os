import fs from 'fs/promises';
import path from 'path';
import { getDataDir } from '@/lib/paths';

const DATA_DIR = getDataDir();
const DB_FILE = path.join(DATA_DIR, 'usage.json');

interface UsageRecord {
  id: number;
  sessionId: string;
  agentId: string;
  model: string;
  timestamp: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface UsageDB {
  nextId: number;
  records: UsageRecord[];
}

let cache: UsageDB | null = null;

async function load(): Promise<UsageDB> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch {
    cache = { nextId: 1, records: [] };
  }
  return cache!;
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

const MODEL_COST_MAP: Record<string, { inputPerM: number; outputPerM: number }> = {
  'claude': { inputPerM: 3, outputPerM: 15 },
  'anthropic/claude': { inputPerM: 3, outputPerM: 15 },
  'gpt-4': { inputPerM: 10, outputPerM: 30 },
  'gpt-3.5': { inputPerM: 0.5, outputPerM: 1.5 },
  'deepseek': { inputPerM: 0.5, outputPerM: 2 },
  'gemini': { inputPerM: 0.5, outputPerM: 1.5 },
  'nex-agi/nex-n2-pro': { inputPerM: 0.5, outputPerM: 2 },
};

const DEFAULT_COST = { inputPerM: 2, outputPerM: 8 };

function getModelCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const lower = model.toLowerCase();
  let pricing = DEFAULT_COST;
  for (const [key, cost] of Object.entries(MODEL_COST_MAP)) {
    if (lower.startsWith(key)) {
      pricing = cost;
      break;
    }
  }
  const inputCost = (promptTokens / 1_000_000) * pricing.inputPerM;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPerM;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}

export async function recordUsage(
  sessionId: string,
  agentId: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): Promise<UsageRecord> {
  const db = await load();
  const totalTokens = promptTokens + completionTokens;
  const estimatedCost = getModelCost(model, promptTokens, completionTokens);
  const record: UsageRecord = {
    id: db.nextId++,
    sessionId,
    agentId,
    model,
    timestamp: new Date().toISOString(),
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCost,
  };
  db.records.push(record);
  await persist();
  return record;
}

export async function getSessionUsage(sessionId: string): Promise<UsageRecord[]> {
  const db = await load();
  return db.records.filter((r) => r.sessionId === sessionId);
}

export interface AggregatedUsage {
  totalTokens: number;
  totalCost: number;
  totalSessions: number;
  totalCalls: number;
  promptTokens: number;
  completionTokens: number;
}

export interface AgentUsageSummary {
  agentId: string;
  model: string;
  totalTokens: number;
  totalCost: number;
  totalCalls: number;
}

export interface DailyUsage {
  date: string;
  totalTokens: number;
  totalCost: number;
}

export interface UsageSummary {
  overall: AggregatedUsage;
  byAgent: AgentUsageSummary[];
  byDay: DailyUsage[];
  bySession: Array<{
    sessionId: string;
    agentId: string;
    model: string;
    totalTokens: number;
    totalCost: number;
    timestamp: string;
  }>;
}

export async function getAgentUsage(
  agentId: string,
  days = 7
): Promise<AgentUsageSummary[]> {
  const db = await load();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = db.records.filter(
    (r) => r.agentId === agentId && new Date(r.timestamp) >= cutoff
  );
  const map = new Map<string, AgentUsageSummary>();
  for (const r of filtered) {
    const key = `${r.agentId}-${r.model}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalTokens += r.totalTokens;
      existing.totalCost += r.estimatedCost;
      existing.totalCalls += 1;
    } else {
      map.set(key, {
        agentId: r.agentId,
        model: r.model,
        totalTokens: r.totalTokens,
        totalCost: r.estimatedCost,
        totalCalls: 1,
      });
    }
  }
  return Array.from(map.values());
}

export async function getOverallUsage(days = 30): Promise<UsageSummary> {
  const db = await load();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = db.records.filter((r) => new Date(r.timestamp) >= cutoff);

  const overall: AggregatedUsage = {
    totalTokens: 0,
    totalCost: 0,
    totalSessions: 0,
    totalCalls: filtered.length,
    promptTokens: 0,
    completionTokens: 0,
  };

  const agentMap = new Map<string, AgentUsageSummary>();
  const dayMap = new Map<string, DailyUsage>();
  const sessionMap = new Map<string, {
    sessionId: string;
    agentId: string;
    model: string;
    totalTokens: number;
    totalCost: number;
    timestamp: string;
  }>();

  const seenSessions = new Set<string>();

  for (const r of filtered) {
    overall.totalTokens += r.totalTokens;
    overall.totalCost += r.estimatedCost;
    overall.promptTokens += r.promptTokens;
    overall.completionTokens += r.completionTokens;
    seenSessions.add(r.sessionId);

    const agentKey = `${r.agentId}-${r.model}`;
    const existing = agentMap.get(agentKey);
    if (existing) {
      existing.totalTokens += r.totalTokens;
      existing.totalCost += r.estimatedCost;
      existing.totalCalls += 1;
    } else {
      agentMap.set(agentKey, {
        agentId: r.agentId,
        model: r.model,
        totalTokens: r.totalTokens,
        totalCost: r.estimatedCost,
        totalCalls: 1,
      });
    }

    const day = r.timestamp.slice(0, 10);
    const dayExisting = dayMap.get(day);
    if (dayExisting) {
      dayExisting.totalTokens += r.totalTokens;
      dayExisting.totalCost += r.estimatedCost;
    } else {
      dayMap.set(day, { date: day, totalTokens: r.totalTokens, totalCost: r.estimatedCost });
    }

    const sessKey = r.sessionId;
    const sessExisting = sessionMap.get(sessKey);
    if (sessExisting) {
      sessExisting.totalTokens += r.totalTokens;
      sessExisting.totalCost += r.estimatedCost;
    } else {
      sessionMap.set(sessKey, {
        sessionId: r.sessionId,
        agentId: r.agentId,
        model: r.model,
        totalTokens: r.totalTokens,
        totalCost: r.estimatedCost,
        timestamp: r.timestamp,
      });
    }
  }

  overall.totalSessions = seenSessions.size;

  const byDay = Array.from(dayMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const byAgent = Array.from(agentMap.values()).sort(
    (a, b) => b.totalCost - a.totalCost
  );

  const bySession = Array.from(sessionMap.values()).sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );

  return { overall, byAgent, byDay, bySession };
}
