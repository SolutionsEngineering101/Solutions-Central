import { createExtensionToken } from "@/lib/extension-token";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { name?: string; code?: string };
  const code = (body.code ?? "").trim();
  const name = (body.name ?? "").trim() || "Sales Team";

  const validCode = process.env.SALES_INVITE_CODE;
  if (!validCode) {
    return Response.json({ ok: false, error: "Not configured" }, { status: 503 });
  }
  if (!code || code !== validCode) {
    return Response.json({ ok: false, error: "Invalid invite code" }, { status: 401 });
  }

  const token = createExtensionToken({
    sub: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    role: "sales",
  });

  return Response.json({ ok: true, token });
}
