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
        background: "#091522",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#D0E0FF",
      }}
    >
      {/* Token element — read by the extension content script */}
      <div id="sc-extension-token" data-token={token} style={{ display: "none" }} />

      <div
        style={{
          background: "#102038",
          border: "1px solid #1E3C6A",
          borderRadius: 12,
          padding: "40px 48px",
          textAlign: "center",
          maxWidth: 380,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: "#2D6BE4",
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
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Authenticated</h1>
        <p style={{ color: "#6A85A8", fontSize: 14, marginBottom: 4 }}>
          Signed in as <strong style={{ color: "#D0E0FF" }}>{user.name}</strong>
        </p>
        <p style={{ color: "#6A85A8", fontSize: 13 }}>
          The extension is collecting your token. This tab will close automatically.
        </p>
      </div>
    </main>
  );
}
