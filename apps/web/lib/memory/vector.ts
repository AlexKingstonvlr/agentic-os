import fs from 'fs/promises';
import path from 'path';

interface IndexEntry {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export class VectorIndex {
  private documents: IndexEntry[] = [];
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      this.documents = JSON.parse(raw);
    } catch {
      this.documents = [];
    }
  }

  async persist(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.documents), 'utf-8');
  }

  async addDocument(id: string, text: string, metadata: Record<string, unknown>, embedding: number[]): Promise<void> {
    this.documents.push({ id, text, metadata, embedding });
    await this.persist();
  }

  async removeDocument(id: string): Promise<void> {
    this.documents = this.documents.filter(d => d.id !== id);
    await this.persist();
  }

  async clear(): Promise<void> {
    this.documents = [];
    await this.persist();
  }

  search(queryEmbedding: number[], limit = 5): Array<{ id: string; text: string; metadata: Record<string, unknown>; score: number }> {
    const scored = this.documents.map(doc => ({
      id: doc.id,
      text: doc.text,
      metadata: doc.metadata,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  listDocuments(): Array<{ id: string; text: string; metadata: Record<string, unknown> }> {
    return this.documents.map(({ id, text, metadata }) => ({ id, text, metadata }));
  }

  get size(): number {
    return this.documents.length;
  }
}
