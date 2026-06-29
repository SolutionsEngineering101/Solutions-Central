import { timingSafeEqual } from "crypto";

interface OTPRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  used: boolean;
  sendCount: number;
  windowStart: number;
}

const store = new Map<string, OTPRecord>();

const OTP_TTL      = 10 * 60 * 1000;   // 10 min
const MAX_ATTEMPTS = 3;
const SEND_LIMIT   = 3;
const SEND_WINDOW  = 15 * 60 * 1000;   // 15 min

export function canSend(email: string): boolean {
  const rec = store.get(email);
  if (!rec) return true;
  if (Date.now() - rec.windowStart > SEND_WINDOW) return true;
  return rec.sendCount < SEND_LIMIT;
}

export function storeOTP(email: string, otp: string): void {
  const rec = store.get(email);
  const now = Date.now();
  const windowExpired = !rec || now - rec.windowStart > SEND_WINDOW;
  store.set(email, {
    otp,
    expiresAt:   now + OTP_TTL,
    attempts:    0,
    used:        false,
    sendCount:   windowExpired ? 1 : (rec?.sendCount ?? 0) + 1,
    windowStart: windowExpired ? now : (rec?.windowStart ?? now),
  });
}

export function verifyOTP(email: string, otp: string): { ok: boolean; error?: string } {
  const rec = store.get(email);
  if (!rec)                          return { ok: false, error: "Code not found — request a new one" };
  if (Date.now() > rec.expiresAt)    return { ok: false, error: "Code expired — request a new one" };
  if (rec.used)                      return { ok: false, error: "Code already used — request a new one" };
  if (rec.attempts >= MAX_ATTEMPTS)  return { ok: false, error: "Too many attempts — request a new one" };
  if (!/^\d{6}$/.test(otp))         return { ok: false, error: "Invalid code" };

  rec.attempts++;

  const match = timingSafeEqual(Buffer.from(rec.otp), Buffer.from(otp));
  if (!match) {
    const left = MAX_ATTEMPTS - rec.attempts;
    if (left <= 0) return { ok: false, error: "Code invalidated — request a new one" };
    return { ok: false, error: `Invalid code — ${left} attempt${left === 1 ? "" : "s"} left` };
  }

  rec.used = true;
  return { ok: true };
}
