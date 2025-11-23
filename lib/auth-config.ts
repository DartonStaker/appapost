import { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

// Basic credentials for Apparely
const APPARELY_CREDENTIALS = {
  email: "apparelydotcoza@gmail.com",
  password: "H@ppines5",
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check credentials
        if (
          credentials.email === APPARELY_CREDENTIALS.email &&
          credentials.password === APPARELY_CREDENTIALS.password
        ) {
          // Get or create user in database
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1)

          if (existingUser) {
            return {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name || "Apparely User",
              image: existingUser.image,
            }
          }

          // Create user if doesn't exist
          const userId = createId()
          await db.insert(users).values({
            id: userId,
            email: credentials.email,
            name: "Apparely User",
            image: null,
          })

          return {
            id: userId,
            email: credentials.email,
            name: "Apparely User",
            image: null,
          }
        }

        return null
      },
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

