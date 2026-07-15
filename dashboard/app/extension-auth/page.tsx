import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createExtensionToken } from "@/lib/extension-token";
import { redirect } from "next/navigation";

export const metadata = { title: "Solutions Central — Extension Auth" };

export default async function ExtensionAuthPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/extension-auth");
  }

  const user = session.user as { id?: string; name?: string | null; email?: string | null };
  const token = createExtensionToken({
    sub: user.id || user.email || "unknown",
    name: user.name || "Team Member",
    email: user.email ?? undefined,
    role: "team",
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--color-white)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-family-base)",
        color: "var(--text-primary)",
      }}
    >
      {/* Token element — read by the extension content script */}
      <div id="sc-extension-token" data-token={token} style={{ display: "none" }} />

      <div
        style={{
          background: "var(--color-white)",
          border: "1px solid var(--neutral-200)",
          borderRadius: 12,
          boxShadow: "var(--shadow-sm)",
          padding: "40px 48px",
          textAlign: "center",
          maxWidth: 380,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: "var(--brand-500)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            margin: "0 auto 20px",
            color: "white",
          }}
        >
          SC
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>Authenticated</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 4 }}>
          Signed in as <strong style={{ color: "var(--text-primary)" }}>{user.name}</strong>
        </p>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          The extension is collecting your token. This tab will close automatically.
        </p>
      </div>
    </main>
  );
}
