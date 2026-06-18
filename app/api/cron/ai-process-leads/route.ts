/**
 * Cron Job: Run AI agent on new leads
 * Scheduled via vercel.json to run every 15 minutes.
 */

import { NextRequest, NextResponse } from "next/server";
import { processNewLeads, detectStaleLeads } from "@/lib/aiAgent";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (env.cronSecret && authHeader !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.openaiApiKey) {
    return NextResponse.json(
      { skipped: true, reason: "OPENAI_API_KEY not configured" },
      { status: 200 }
    );
  }

  const [agentResult, staleIds] = await Promise.all([
    processNewLeads(),
    detectStaleLeads(7),
  ]);

  console.log("[Cron: ai-process-leads]", {
    processed: agentResult.processed,
    staleLeadsFound: staleIds.length,
  });

  return NextResponse.json({
    processed: agentResult.processed,
    errors: agentResult.errors,
    staleLeadsFound: staleIds.length,
  });
}
