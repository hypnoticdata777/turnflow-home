import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as z from "zod";
import { db } from "@/lib/db";
import { verifyPasswordTimingSafe } from "@/lib/auth/password";
import { clearAttempts, isRateLimited, recordAttempt } from "@/lib/auth/rate-limit";
import {
  LOGIN_EMAIL_RULE,
  LOGIN_IP_RULE,
  clientIpFromHeaders,
} from "@/lib/auth/rate-limit-policy";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // P0 (2026-09-28): this is the one gate every sign-in passes through,
      // including direct POSTs to /api/auth/callback/credentials, so the
      // rate limit and timing-safe compare live here, not only in loginAction.
      async authorize(rawCredentials, request) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const ip = request ? clientIpFromHeaders(request.headers) : "unknown";
        if (
          (await isRateLimited(LOGIN_EMAIL_RULE, email)) ||
          (await isRateLimited(LOGIN_IP_RULE, ip))
        ) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.email, email),
        });
        const passwordMatches = await verifyPasswordTimingSafe(
          parsed.data.password,
          user?.passwordHash
        );
        if (!user || !passwordMatches) {
          await recordAttempt(LOGIN_EMAIL_RULE, email);
          await recordAttempt(LOGIN_IP_RULE, ip);
          return null;
        }
        await clearAttempts(LOGIN_EMAIL_RULE, email);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as "owner" | "vendor" | "collaborator";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "owner" | "vendor" | "collaborator";
      }
      return session;
    },
  },
});
