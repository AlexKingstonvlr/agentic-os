export interface Chunk {
  id: string;
  text: string;
  index: number;
}

export function chunkText(text: string, maxChunkSize = 500, overlap = 50): Chunk[] {
  const normalized = text.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];

  for (const para of paragraphs) {
    if (para.length > maxChunkSize) {
      let remaining = para;
      while (remaining.length > maxChunkSize) {
        chunks.push(remaining.slice(0, maxChunkSize));
        remaining = remaining.slice(maxChunkSize - overlap);
      }
      if (remaining.trim()) {
        const last = chunks[chunks.length - 1] || '';
        if (last.length + remaining.length + 1 <= maxChunkSize) {
          chunks[chunks.length - 1] = last + remaining;
        } else {
          chunks.push(remaining);
        }
      }
      continue;
    }

    const prev = chunks[chunks.length - 1] || '';
    if (prev.length + para.length + 2 <= maxChunkSize) {
      chunks[chunks.length - 1] = prev ? prev + '\n\n' + para : para;
    } else {
      chunks.push(para);
    }
  }

  return chunks.map((text, i) => ({ id: '', text, index: i }));
}
