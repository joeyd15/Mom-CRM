/**
 * Cron Job: Sync leads from Follow Up Boss
 * Scheduled via vercel.json to run every hour.
 *
 * Protect with CRON_SECRET to prevent unauthorized calls.
 * Vercel automatically sets the Authorization header for cron jobs.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchAllPeople, mapFubPersonToLead } from "@/lib/followUpBoss";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (env.cronSecret && authHeader !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.fubApiKey) {
    return NextResponse.json(
      { skipped: true, reason: "FOLLOW_UP_BOSS_API_KEY not configured" },
      { status: 200 }
    );
  }

  const startTime = Date.now();
  let leadsFound = 0;
  let leadsAdded = 0;
  let leadsUpdated = 0;
  let syncError: string | null = null;

  try {
    const response = await fetchAllPeople(100, 0);
    const people = response.people ?? [];
    leadsFound = people.length;

    for (const person of people) {
      const mapped = mapFubPersonToLead(person);

      const existing = await db.lead.findFirst({
        where: {
          OR: [
            { followUpBossId: String(person.id) },
            ...(mapped.email ? [{ email: mapped.email }] : []),
          ],
        },
      });

      if (existing) {
        await db.lead.update({
          where: { id: existing.id },
          data: {
            name: mapped.name,
            source: mapped.source,
            followUpBossId: mapped.followUpBossId,
            rawFubData: mapped.rawFubData as Parameters<
              typeof db.lead.update
            >[0]["data"]["rawFubData"],
          },
        });
        leadsUpdated++;
      } else {
        await db.lead.create({
          data: {
            followUpBossId: mapped.followUpBossId,
            name: mapped.name,
            email: mapped.email,
            phone: mapped.phone,
            source: mapped.source,
            status: mapped.status,
            assignedAgent: mapped.assignedAgent,
            propertyAddress: mapped.propertyAddress,
            inquiryMessage: mapped.inquiryMessage,
            rawFubData: mapped.rawFubData as Parameters<
              typeof db.lead.create
            >[0]["data"]["rawFubData"],
          },
        });
        leadsAdded++;
      }
    }
  } catch (err) {
    syncError = err instanceof Error ? err.message : String(err);
    console.error("[Cron: sync-leads]", syncError);
  }

  await db.syncLog.create({
    data: {
      source: "follow_up_boss",
      status: syncError ? "error" : "success",
      leadsFound,
      leadsAdded,
      leadsUpdated,
      error: syncError,
      details: {
        durationMs: Date.now() - startTime,
        triggeredBy: "cron",
      },
    },
  });

  return NextResponse.json({
    success: !syncError,
    leadsFound,
    leadsAdded,
    leadsUpdated,
    error: syncError,
  });
}
