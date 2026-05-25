"use client";

import { signIn } from "next-auth/react";
import { GitBranch } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 w-full max-w-sm text-center">
        <div className="mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-lg">SC</span>
          </div>
          <h1 className="text-white text-xl font-semibold">Solutions Central</h1>
          <p className="text-gray-400 text-sm mt-1">SE Team · Vantage Circle</p>
        </div>
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm"
        >
          <GitBranch size={16} />
          Sign in with GitHub
        </button>
        <p className="text-gray-600 text-xs mt-4">Access restricted to the SE team</p>
      </div>
    </div>
  );
}
