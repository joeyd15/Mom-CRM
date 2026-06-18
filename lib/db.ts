import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn(
      "[DB] DATABASE_URL is not set. Database queries will fail until it is configured."
    );
  }

  const adapter = new PrismaPg({ connectionString: connectionString ?? "" });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Cache the client globally across requests in the same serverless function instance.
// This prevents exhausting the Supabase connection pool on repeated cold starts.
export const db = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = db;
