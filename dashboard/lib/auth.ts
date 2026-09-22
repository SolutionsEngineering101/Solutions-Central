import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn() {
      // Allow any GitHub account that completes OAuth. Access is controlled at the
      // GitHub OAuth App level (org/third-party approval), not here. To restrict to
      // specific people later, check `profile.login` against an allow-list and return false.
      return true;
    },
    async jwt({ token, profile }) {
      // GitHub's `login` (username) is always present, unlike the optional
      // profile "name" field — the more reliable identity signal to keep.
      if (profile && "login" in profile) {
        token.login = (profile as { login?: string }).login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      if (session.user && token.login) {
        (session.user as { login?: string }).login = token.login as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
