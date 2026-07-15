"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { GitBranch, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

// Maps NextAuth error codes (passed back as ?error=) to human-readable reasons,
// so a blocked teammate sees *why* instead of a generic screen.
const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "GitHub blocked this sign-in. Most likely the OAuth App is restricted by the organization — an org owner needs to approve it under Settings → Third-party access.",
  Configuration:
    "The login is misconfigured (check GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / NEXTAUTH_SECRET / NEXTAUTH_URL).",
  OAuthSignin: "Could not start the GitHub sign-in. Check the OAuth App credentials and callback URL.",
  OAuthCallback:
    "GitHub rejected the callback. The OAuth App's Authorization callback URL must exactly match this site's URL + /api/auth/callback/github.",
  OAuthAccountNotLinked: "This email is already linked to a different sign-in method.",
  Callback: "Something went wrong completing the sign-in. Please try again.",
  Default: "Sign-in failed. Please try again.",
};

function LoginCard() {
  const params = useSearchParams();
  const errorCode = params.get("error");
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default : null;

  return (
    <Card className="p-10 md:p-10 w-full max-w-sm text-center">
      <div className="mb-6">
        <div className="w-12 h-12 bg-brand-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-white font-bold text-lg">SC</span>
        </div>
        <h1 className="text-fg-primary text-xl font-semibold">Solutions Central</h1>
        <p className="text-fg-secondary text-sm mt-1">SE Team · Vantage Circle</p>
      </div>

      {errorMessage && (
        <Alert variant="error" icon={<AlertTriangle size={15} />} title="Couldn't sign in" className="mb-5 text-left">
          <p>{errorMessage}</p>
          <p className="opacity-60 mt-1">Error code: {errorCode}</p>
        </Alert>
      )}

      <Button variant="neutral" size="lg" className="w-full" onClick={() => signIn("github", { callbackUrl: "/" })}>
        <GitBranch size={16} />
        Sign in with GitHub
      </Button>
      <p className="text-fg-secondary text-xs mt-4">Anyone with a GitHub account on the SE team can sign in</p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-fg-secondary text-sm">Loading…</div>}>
        <LoginCard />
      </Suspense>
    </div>
  );
}
