/**
 * Cron Job: Process campaign steps
 * Scheduled via vercel.json to run every 30 minutes.
 */

import { NextRequest, NextResponse } from "next/server";
import { processCampaignSteps } from "@/lib/campaignEngine";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (env.cronSecret && authHeader !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processCampaignSteps();
  console.log("[Cron: process-campaigns]", result);

  return NextResponse.json(result);
}
