import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const googleId = account.providerAccountId;
        const existing = db
          .prepare("SELECT id FROM users WHERE google_id = ? OR email = ?")
          .get(googleId, user.email) as { id: string } | undefined;

        if (existing) {
          db.prepare(
            `UPDATE users SET name = ?, image = ?, google_id = ?, email = ? WHERE id = ?`
          ).run(user.name || null, user.image || null, googleId, user.email, existing.id);
        } else {
          const id = uuidv4();
          db.prepare(
            `INSERT INTO users (id, email, name, image, google_id, nickname)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(
            id,
            user.email,
            user.name || null,
            user.image || null,
            googleId,
            user.name?.split(" ")[0] || null
          );
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account?.provider === "google" && user?.email) {
        const row = db
          .prepare("SELECT id, nickname FROM users WHERE google_id = ? OR email = ?")
          .get(account.providerAccountId, user.email) as
          | { id: string; nickname: string | null }
          | undefined;
        if (row) {
          token.userId = row.id;
          token.nickname = row.nickname;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.nickname = (token.nickname as string) || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
