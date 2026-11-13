import "server-only";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole, UserStatus } from "@/generated/prisma/enums";
import { getDb } from "@/server/db";
import { recordAuditEvent } from "./audit";
import { verifyDummyPassword, verifyPassword } from "./password";
import { credentialsLoginSchema } from "./schemas";
import {
  createDatabaseSession,
  DEFAULT_SESSION_TTL_SECONDS,
  revokeDatabaseSession,
  SHORT_SESSION_TTL_SECONDS,
} from "./session-repository";

declare module "next-auth" {
  interface Session {
    sessionToken?: string;
    mfaVerified?: boolean;
    user: {
      id: string;
      role: UserRole;
      status: UserStatus;
      mfaEnabled: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    status: UserStatus;
    mfaEnabled: boolean;
    sessionToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: DEFAULT_SESSION_TTL_SECONDS,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember me", type: "text" },
      },
      async authorize(rawCredentials, request) {
        const parsed = credentialsLoginSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password, rememberMe } = parsed.data;
        const db = getDb();
        const ipAddress = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
        const userAgent = request?.headers?.get("user-agent") ?? null;

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            status: true,
            emailVerified: true,
            mfaEnabled: true,
            deletedAt: true,
          },
        });

        if (!user || !user.passwordHash || user.deletedAt !== null) {
          await verifyDummyPassword(password);
          await recordAuditEvent({
            eventType: "LOGIN_FAILED",
            outcome: "FAILURE",
            ipAddress,
            userAgent,
            metadata: { reason: "INVALID_CREDENTIALS" },
          });
          return null;
        }

        const passwordValid = await verifyPassword(user.passwordHash, password);
        if (!passwordValid) {
          await recordAuditEvent({
            targetUserId: user.id,
            eventType: "LOGIN_FAILED",
            outcome: "FAILURE",
            ipAddress,
            userAgent,
            metadata: { reason: "INVALID_PASSWORD" },
          });
          return null;
        }

        if (user.status !== "ACTIVE") {
          await recordAuditEvent({
            targetUserId: user.id,
            eventType: "LOGIN_FAILED",
            outcome: "DENIED",
            ipAddress,
            userAgent,
            metadata: { reason: `ACCOUNT_${user.status}` },
          });
          return null;
        }

        if (!user.emailVerified) {
          await recordAuditEvent({
            targetUserId: user.id,
            eventType: "LOGIN_FAILED",
            outcome: "DENIED",
            ipAddress,
            userAgent,
            metadata: { reason: "EMAIL_UNVERIFIED" },
          });
          return null;
        }

        const ttlSeconds = rememberMe ? DEFAULT_SESSION_TTL_SECONDS : SHORT_SESSION_TTL_SECONDS;

        const dbSession = await createDatabaseSession({
          userId: user.id,
          ipAddress,
          userAgent,
          ttlSeconds,
        });

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await recordAuditEvent({
          actorId: user.id,
          targetUserId: user.id,
          eventType: "LOGIN_SUCCESS",
          outcome: "SUCCESS",
          ipAddress,
          userAgent,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          mfaEnabled: user.mfaEnabled,
          sessionToken: dbSession.sessionToken,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.status = user.status;
        token.mfaEnabled = user.mfaEnabled;
        token.sessionToken = user.sessionToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as UserRole) ?? "STUDENT";
        session.user.status = (token.status as UserStatus) ?? "ACTIVE";
        session.user.mfaEnabled = Boolean(token.mfaEnabled);
      }
      if (typeof token.sessionToken === "string") {
        session.sessionToken = token.sessionToken;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sessionToken) {
        const sessionToken = String(message.token.sessionToken);
        await revokeDatabaseSession(sessionToken);
        await recordAuditEvent({
          actorId: message.token.sub ?? null,
          targetUserId: message.token.sub ?? null,
          eventType: "LOGOUT",
          outcome: "SUCCESS",
        });
      }
    },
  },
});
