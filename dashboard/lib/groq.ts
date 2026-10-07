// Groq API client (OpenAI-compatible REST) — no SDK dependency.
// Model overridable via GROQ_MODEL env var; defaults to openai/gpt-oss-120b (open-weight; llama-3.3-70b-versatile was retired by Groq).

const API = "https://api.groq.com/openai/v1";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export function groqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

// Input shape kept compatible with the Gemini client so route files need minimal changes.
export type GeminiPart = { text: string };
export type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

export async function callGroq(opts: {
  system: string;
  contents: GeminiContent[];
  schema?: unknown;       // When set, forces JSON output mode (structure must be described in system prompt)
  temperature?: number;
  maxTokens?: number;     // Caps output; also lowers what Groq reserves against the TPM limit
}): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");

  const messages = [
    { role: "system", content: opts.schema ? `${opts.system}\n\nRespond with valid JSON.` : opts.system },
    ...opts.contents.map((c) => ({
      role: c.role === "model" ? "assistant" : "user",
      content: c.parts.map((p) => p.text).join(""),
    })),
  ];

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: opts.temperature ?? 0.4,
    ...(opts.schema ? { response_format: { type: "json_object" } } : {}),
    ...(opts.maxTokens ? { max_completion_tokens: opts.maxTokens } : {}),
    // gpt-oss spends hidden reasoning tokens that count against the free-tier
    // 8k tokens/min budget; "low" keeps answers fast and within it.
    ...(MODEL.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
  };

  const send = () => fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let res = await send();
  // Free tier is limited per minute; a short wait usually clears it. Retry once
  // when Groq asks for <= 10s, otherwise surface the 429 to the caller.
  if (res.status === 429) {
    const waitSec = Number(res.headers.get("retry-after") ?? "");
    if (Number.isFinite(waitSec) && waitSec > 0 && waitSec <= 10) {
      await new Promise((r) => setTimeout(r, waitSec * 1000));
      res = await send();
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const out: string = data?.choices?.[0]?.message?.content ?? "";
  if (!out) {
    const reason = data?.choices?.[0]?.finish_reason ?? "no content returned";
    throw new Error(`Groq returned no text (${reason})`);
  }
  return out;
}

// Parse JSON from a model response, tolerating ```json fences if any slip through.
export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned) as T;
}

// ── Embeddings ────────────────────────────────────────────────────────────────
// Groq does not provide an embeddings API. Returns empty arrays so callers
// can detect unavailability and fall back to keyword-only ranking.
export async function batchEmbedTexts(_texts: string[]): Promise<number[][]> {
  return [];
}

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
