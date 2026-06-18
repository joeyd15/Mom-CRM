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

  // Supabase's connection pooler (Supavisor) presents a certificate that is not
  // in Node's default CA trust store. node-postgres verifies the chain by default
  // even with `sslmode=require`, which throws:
  //   "Error opening a TLS connection: self-signed certificate in certificate chain" (P1011)
  // We keep TLS encryption on but skip CA verification so the pooler is reachable
  // from Vercel's serverless runtime. The connection is still encrypted in transit.
  const adapter = new PrismaPg({
    connectionString: connectionString ?? "",
    ssl: { rejectUnauthorized: false },
  });

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
