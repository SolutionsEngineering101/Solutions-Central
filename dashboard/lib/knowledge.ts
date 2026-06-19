// Central knowledge index types and BM25 search.
// The index is stored as dashboard-data/knowledge-index.json in the GitHub repo
// and rebuilt on demand via POST /api/knowledge/build.

export interface KnowledgeChunk {
  id: string;
  source: "form" | "playbook" | "blueprint" | "confluence";
  title: string;
  text: string;
  meta: {
    client?: string;
    status?: string;
    complexity?: string;
    department?: string;
    tags?: string[];
    date?: string;
    author?: string;
    url?: string;
  };
  // Pre-computed at build time so the chat route only pays IDF cost per query.
  tf: Record<string, number>;
  len: number;
}

export interface KnowledgeIndex {
  builtAt: string;
  chunkCount: number;
  chunks: KnowledgeChunk[];
}

export interface SourceRef {
  id: string;
  source: KnowledgeChunk["source"];
  title: string;
  url?: string;
}

// Tokenise text into lowercase alphanumeric tokens of length >= 2.
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length >= 2);
}

export function computeTf(text: string): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const t of tokenize(text)) tf[t] = (tf[t] ?? 0) + 1;
  return tf;
}

// Standard Okapi BM25 with pre-computed tf maps.
export function bm25Search(
  index: KnowledgeIndex,
  query: string,
  topN = 15,
  k1 = 1.5,
  b = 0.75
): KnowledgeChunk[] {
  const qTokens = [...new Set(tokenize(query))];
  if (!qTokens.length) return [];

  const chunks = index.chunks;
  const N = chunks.length;
  if (!N) return [];

  const avgLen = chunks.reduce((s, c) => s + c.len, 0) / N;

  // IDF for each query token
  const idf: Record<string, number> = {};
  for (const t of qTokens) {
    const df = chunks.filter((c) => (c.tf[t] ?? 0) > 0).length;
    idf[t] = Math.log(1 + (N - df + 0.5) / (df + 0.5));
  }

  const scored = chunks.map((c) => {
    let score = 0;
    for (const t of qTokens) {
      const tf = c.tf[t] ?? 0;
      if (!tf) continue;
      score += idf[t] * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (c.len / avgLen)));
    }
    return { chunk: c, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((s) => s.chunk);
}
