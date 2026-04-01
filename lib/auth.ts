import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) return null;

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!passwordMatch) return null;

        return { id: user.id, email: user.email! };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      // Re-fetch roles on every token refresh for immediate consistency
      if (token.id) {
        const userRoles = await prisma.userRole.findMany({
          where: { userId: token.id },
          include: { role: true },
        });
        token.roles = userRoles.map((ur) => ur.role.name);
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      session.user.roles = token.roles ?? [];
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
