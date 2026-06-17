import fs from 'fs/promises';
import path from 'path';
import { getDataDir, resolveProjectPath } from '@/lib/paths';
import { VectorIndex } from './vector';
import { chunkText } from './chunker';
import { getEmbedding, getEmbeddings } from './embeddings';

let index: VectorIndex | null = null;

const VECTOR_INDEX_PATH = path.join(getDataDir(), 'vector-index.json');

async function getIndex(): Promise<VectorIndex> {
  if (!index) {
    index = new VectorIndex(VECTOR_INDEX_PATH);
    await index.load();
  }
  return index;
}

export async function initMemory(): Promise<void> {
  await getIndex();
}

export async function storeMemory(
  agentId: string | null,
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const idx = await getIndex();

  const memoryDir = agentId
    ? resolveProjectPath('memory', agentId)
    : resolveProjectPath('memory');

  await fs.mkdir(memoryDir, { recursive: true });

  const fileName = (metadata.path as string) || `memory-${Date.now()}.md`;
  const filePath = path.join(memoryDir, fileName);
  await fs.writeFile(filePath, content, 'utf-8');

  const chunks = chunkText(content);
  const embeddings = await getEmbeddings(chunks.map(c => c.text));

  for (let i = 0; i < chunks.length; i++) {
    const chunkId = agentId ? `${agentId}/${fileName}#${i}` : `${fileName}#${i}`;
    await idx.addDocument(
      chunkId,
      chunks[i].text,
      {
        ...metadata,
        agentId: agentId || null,
        fileName,
        chunkIndex: i,
      },
      embeddings[i]
    );
  }
}

export async function searchMemory(
  agentId: string | null,
  query: string,
  limit = 5
): Promise<Array<{ id: string; text: string; metadata: Record<string, unknown>; score: number }>> {
  const idx = await getIndex();
  const queryEmbedding = await getEmbedding(query);
  const results = idx.search(queryEmbedding, limit * 5);

  const filtered = agentId
    ? results.filter(r => r.metadata.agentId === agentId)
    : results.filter(r => !r.metadata.agentId);

  return filtered.slice(0, limit);
}

export async function deleteMemory(agentId: string | null, docPath: string): Promise<void> {
  const idx = await getIndex();

  const memoryDir = agentId
    ? resolveProjectPath('memory', agentId)
    : resolveProjectPath('memory');

  const filePath = path.join(memoryDir, docPath);
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore
  }

  const prefix = agentId ? `${agentId}/${docPath}` : docPath;
  const entries = idx.listDocuments().filter(d => d.id.startsWith(prefix));
  for (const entry of entries) {
    await idx.removeDocument(entry.id);
  }
}

export async function listMemory(agentId: string | null): Promise<Array<{ name: string; path: string; preview: string }>> {
  const memoryDir = agentId
    ? resolveProjectPath('memory', agentId)
    : resolveProjectPath('memory');

  let entries: string[];
  try {
    entries = await fs.readdir(memoryDir);
  } catch {
    return [];
  }

  const files = await Promise.all(
    entries.map(async (name) => {
      const filePath = path.join(memoryDir, name);
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) return null;
        const content = await fs.readFile(filePath, 'utf-8');
        return { name, path: name, preview: content.slice(0, 200) };
      } catch {
        return null;
      }
    })
  );

  return files.filter(Boolean) as Array<{ name: string; path: string; preview: string }>;
}

export async function reindexMemory(): Promise<number> {
  const idx = await getIndex();
  await idx.clear();

  const memoryDir = resolveProjectPath('memory');
  let totalChunks = 0;

  async function scanDir(dir: string, agentId: string | null) {
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      let stat;
      try {
        stat = await fs.stat(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        await scanDir(fullPath, entry);
      } else if (stat.isFile()) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const chunks = chunkText(content);
        const embeddings = await getEmbeddings(chunks.map(c => c.text));

        for (let i = 0; i < chunks.length; i++) {
          const chunkId = agentId ? `${agentId}/${entry}#${i}` : `${entry}#${i}`;
          await idx.addDocument(
            chunkId,
            chunks[i].text,
            {
              agentId,
              fileName: entry,
              chunkIndex: i,
            },
            embeddings[i]
          );
          totalChunks++;
        }
      }
    }
  }

  await scanDir(memoryDir, null);
  return totalChunks;
}
