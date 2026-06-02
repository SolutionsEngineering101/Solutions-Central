"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { GitBranch, AlertTriangle } from "lucide-react";

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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 w-full max-w-sm text-center">
      <div className="mb-6">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-white font-bold text-lg">SC</span>
        </div>
        <h1 className="text-white text-xl font-semibold">Solutions Central</h1>
        <p className="text-gray-400 text-sm mt-1">SE Team · Vantage Circle</p>
      </div>

      {errorMessage && (
        <div className="mb-5 text-left bg-red-950/50 border border-red-900 rounded-lg p-3 flex gap-2">
          <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-xs font-medium">Couldn&apos;t sign in</p>
            <p className="text-red-200/80 text-xs mt-0.5">{errorMessage}</p>
            <p className="text-red-200/40 text-[10px] mt-1">Error code: {errorCode}</p>
          </div>
        </div>
      )}

      <button
        onClick={() => signIn("github", { callbackUrl: "/" })}
        className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm"
      >
        <GitBranch size={16} />
        Sign in with GitHub
      </button>
      <p className="text-gray-600 text-xs mt-4">Anyone with a GitHub account on the SE team can sign in</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-gray-600 text-sm">Loading…</div>}>
        <LoginCard />
      </Suspense>
    </div>
  );
}
