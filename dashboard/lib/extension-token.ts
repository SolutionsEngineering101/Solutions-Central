import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.EXTENSION_JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret";
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

interface TokenPayload {
  sub: string;
  name: string;
  email?: string;
  exp: number;
}

function b64u(s: string): string {
  return Buffer.from(s).toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createExtensionToken(payload: Omit<TokenPayload, "exp">): string {
  const full: TokenPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS };
  const data = b64u(JSON.stringify(full));
  return `${data}.${sign(data)}`;
}

export function verifyExtensionToken(token: string): TokenPayload | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 1) return null;
    const data = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    const expected = sign(data);
    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

    const payload: TokenPayload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
