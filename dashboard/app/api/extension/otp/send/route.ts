import { randomInt } from "crypto";
import { canSend, storeOTP } from "@/lib/otp-store";
import { sendOTPEmail } from "@/lib/resend";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { email?: string };
  const email = (body.email ?? "").trim().toLowerCase();

  // Always return ok:true for invalid/non-VC emails to prevent enumeration
  if (!email.endsWith("@vantagecircle.com")) {
    return Response.json({ ok: true });
  }

  if (!canSend(email)) {
    return Response.json(
      { ok: false, error: "Too many requests — try again in 15 minutes" },
      { status: 429 }
    );
  }

  const otp = randomInt(100000, 1000000).toString().padStart(6, "0");
  storeOTP(email, otp);

  try {
    await sendOTPEmail(email, otp);
  } catch {
    // Don't leak Resend errors — return ok so the UI shows "check your email"
  }

  return Response.json({ ok: true });
}
