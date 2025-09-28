import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Environment variables
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL environment variable')
}

// Create PostgreSQL connection
const connectionString = databaseUrl
const client = postgres(connectionString, {
  prepare: false, // Required for Supabase
})

// Create Drizzle database instance
export const db = drizzle(client)

// Export the client for direct SQL queries if needed
export { client }

// Helper function to close database connection (useful for serverless functions)
export const closeDatabase = () => {
  return client.end()
}

// Type for database transactions
export type Database = typeof db
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0]