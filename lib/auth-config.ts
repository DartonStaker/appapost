import { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

// Basic credentials for Apparely - loaded from environment variables
// If not set in env, use defaults (should be set in production)
const APPARELY_CREDENTIALS = {
  email: process.env.APPARELY_EMAIL || "apparelydotcoza@gmail.com",
  password: process.env.APPARELY_PASSWORD || "H@ppines5",
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
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Check credentials
          if (
            credentials.email === APPARELY_CREDENTIALS.email &&
            credentials.password === APPARELY_CREDENTIALS.password
          ) {
            // Get or create user in database
            try {
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
            } catch (dbError) {
              // If database fails, still allow login but without user creation
              console.error("Database error during auth:", dbError)
              return {
                id: createId(),
                email: credentials.email,
                name: "Apparely User",
                image: null,
              }
            }
          }

          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
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
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
    async signIn({ user }) {
      // For credentials provider, user is already created in authorize
      // Just return true to allow sign in
      return true
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
      }
      return token
    },
  },
}

