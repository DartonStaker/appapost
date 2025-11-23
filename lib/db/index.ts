import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Lazy initialization to avoid build-time errors
let client: postgres.Sql | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

function getClient() {
  if (!client) {
    // Get connection string from environment
    // Prefer DATABASE_URL (Supabase standard) or fallback to POSTGRES_URL
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL or POSTGRES_URL environment variable is required"
      )
    }

    // Create postgres client
    // For Supabase: Use connection pooling URL for better performance
    // Direct connection: max: 1 (Supabase free tier limit)
    // Pooled connection: Can use higher max connections
    const isPooledConnection = connectionString.includes("pooler.supabase.com")

    client = postgres(connectionString, {
      max: isPooledConnection ? 10 : 1, // Pooled connections allow more
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }
  return client
}

function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getClient(), { schema })
  }
  return dbInstance
}

// Export db that initializes lazily
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>]
  },
})

