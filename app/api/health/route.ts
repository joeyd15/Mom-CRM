/**
 * TEMPORARY diagnostic endpoint — unauthenticated.
 * Used to surface the real runtime Prisma/DB error on Vercel.
 * REMOVE or minimize after debugging.
 */

import { NextResponse } from "next/server";
import { createRequire } from "module";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const nodeRequire = createRequire(import.meta.url);

function readVersion(pkg: string): string {
  try {
    return (nodeRequire(`${pkg}/package.json`) as { version: string }).version;
  } catch {
    return "unknown";
  }
}

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    databaseUrlPresent: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV ?? null,
    versions: {
      prismaClient: readVersion("@prisma/client"),
      adapterPg: readVersion("@prisma/adapter-pg"),
      pg: readVersion("pg"),
    },
  };

  // Surface (safely) the host/port/db of the connection string without leaking credentials.
  try {
    const raw = process.env.DATABASE_URL ?? "";
    if (raw) {
      const u = new URL(raw);
      diagnostics.connection = {
        protocol: u.protocol,
        host: u.hostname,
        port: u.port || "(default)",
        database: u.pathname.replace(/^\//, ""),
        params: u.search.replace(/^\?/, ""),
      };
    }
  } catch {
    diagnostics.connection = "could not parse DATABASE_URL";
  }

  const results: Record<string, unknown> = {};

  try {
    const settings = await db.settings.findUnique({
      where: { id: "singleton" },
    });
    results.settingsQuery = {
      ok: true,
      settingsRowExists: !!settings,
    };
  } catch (err) {
    results.settingsQuery = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : undefined,
      stack: err instanceof Error ? err.stack : undefined,
      code: (err as { code?: string })?.code,
    };
  }

  try {
    const count = await db.lead.count();
    results.leadCountQuery = { ok: true, count };
  } catch (err) {
    results.leadCountQuery = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : undefined,
      stack: err instanceof Error ? err.stack : undefined,
      code: (err as { code?: string })?.code,
    };
  }

  const anyFailed =
    (results.settingsQuery as { ok: boolean })?.ok === false ||
    (results.leadCountQuery as { ok: boolean })?.ok === false;

  return NextResponse.json(
    { status: anyFailed ? "error" : "ok", diagnostics, results },
    { status: anyFailed ? 500 : 200 }
  );
}
