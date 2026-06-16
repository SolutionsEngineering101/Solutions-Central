// Minimal Google Gemini (Generative Language API) client over REST — no SDK dependency.
// Model is overridable via GEMINI_MODEL; defaults to the fast Flash tier.

const API = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const EMBED_MODEL = "text-embedding-004";

export function geminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export type GeminiPart = { text: string };
export type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

export async function callGemini(opts: {
  system: string;
  contents: GeminiContent[];
  schema?: unknown;       // JSON schema → forces structured JSON output
  temperature?: number;
}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");

  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: opts.system }] },
    contents: opts.contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      ...(opts.schema ? { responseMimeType: "application/json", responseSchema: opts.schema } : {}),
    },
  };

  const res = await fetch(`${API}/${encodeURIComponent(MODEL)}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts as GeminiPart[] | undefined;
  const out = parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!out) {
    const reason =
      data?.candidates?.[0]?.finishReason ?? data?.promptFeedback?.blockReason ?? "no content returned";
    throw new Error(`Gemini returned no text (${reason})`);
  }
  return out;
}

// Parse JSON from a model response, tolerating ```json fences if any slip through.
export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned) as T;
}

// ── Embeddings ────────────────────────────────────────────────────────────────

// batchEmbedContents is not universally available — use parallel individual embedContent calls instead.
export async function batchEmbedTexts(texts: string[]): Promise<number[][]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  if (texts.length === 0) return [];

  const CONCURRENCY = 20;
  const results: number[][] = new Array(texts.length);

  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const slice = texts.slice(i, i + CONCURRENCY);
    const batch = await Promise.all(
      slice.map(async (text) => {
        const res = await fetch(
          `${API}/${encodeURIComponent(EMBED_MODEL)}:embedContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: `models/${EMBED_MODEL}`,
              content: { parts: [{ text }] },
            }),
            cache: "no-store",
          }
        );
        if (!res.ok) throw new Error(`Gemini embed ${res.status}: ${(await res.text()).slice(0, 300)}`);
        const data = await res.json();
        return (data.embedding?.values ?? []) as number[];
      })
    );
    for (let j = 0; j < batch.length; j++) results[i + j] = batch[j];
  }

  return results;
}

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
