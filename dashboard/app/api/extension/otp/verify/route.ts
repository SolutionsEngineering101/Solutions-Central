import { verifyOTP } from "@/lib/otp-store";
import { createExtensionToken } from "@/lib/extension-token";

function nameFromEmail(email: string): string {
  const prefix = email.split("@")[0] ?? "";
  const first = (prefix.split(".")[0] ?? prefix).toLowerCase();
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { email?: string; otp?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const otp   = (body.otp ?? "").trim();

  if (!email || !otp) {
    return Response.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const result = verifyOTP(email, otp);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 401 });
  }

  const name  = nameFromEmail(email);
  const token = createExtensionToken({ sub: email, name, email, role: "sales" });

  return Response.json({ ok: true, token });
}
