import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Get connection string from environment
// Prefer DATABASE_URL (Supabase standard) or fallback to POSTGRES_URL
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!

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

const client = postgres(connectionString, {
  max: isPooledConnection ? 10 : 1, // Pooled connections allow more
  idle_timeout: 20,
  connect_timeout: 10,
})

// Create drizzle instance
export const db = drizzle(client, { schema })

