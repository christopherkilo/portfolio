import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db/prisma";
import { isGitHubAuthConfigured } from "@/lib/demos/event-horizon/authProviders";

/**
 * Auth.js (next-auth v5) — Google primary, GitHub optional.
 * Prisma adapter persists User / Account / Session.
 *
 * Account linking uses Auth.js defaults (safer): separate OAuth identities
 * do not auto-merge by email. Users keep one Account per provider.
 */
function buildProviders(): Provider[] {
  const providers: Provider[] = [
    Google({
      clientId:
        process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    }),
  ];

  if (isGitHubAuthConfigured()) {
    providers.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      }),
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: buildProviders(),
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/demos/event-horizon/signin",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const account = await prisma.account.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          select: { provider: true },
        });
        session.user.provider =
          account?.provider === "google" || account?.provider === "github"
            ? account.provider
            : null;
      }
      return session;
    },
  },
  trustHost: true,
});
