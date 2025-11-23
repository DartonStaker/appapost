import { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

// Custom adapter implementation for Drizzle
// Note: For production, consider using @auth/drizzle-adapter if available
// or implement a full adapter following NextAuth adapter interface

export const authOptions: NextAuthOptions = {
  // Using JWT strategy - adapter not strictly required
  // Users will be created/updated manually in callbacks
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/api/auth/signin",
    error: "/api/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (user.email) {
        // Create or update user in database
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1)

        if (!existingUser) {
          await db.insert(users).values({
            id: createId(),
            email: user.email,
            name: user.name || null,
            image: user.image || null,
          })
        } else {
          await db
            .update(users)
            .set({
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
              updatedAt: new Date(),
            })
            .where(eq(users.email, user.email))
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, session.user.email))
          .limit(1)

        if (user) {
          session.user.id = user.id
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
}

