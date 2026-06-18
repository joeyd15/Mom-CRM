/**
 * Manual Follow Up Boss sync endpoint.
 * Called from the admin dashboard "Sync Follow Up Boss" button.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  fetchAllPeople,
  mapFubPersonToLead,
  testConnection,
} from "@/lib/followUpBoss";
import { env } from "@/lib/env";

export async function POST(_req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.fubApiKey) {
    return NextResponse.json(
      {
        error:
          "FOLLOW_UP_BOSS_API_KEY is not configured. Add it to your environment variables.",
      },
      { status: 400 }
    );
  }

  const startTime = Date.now();
  let leadsFound = 0;
  let leadsAdded = 0;
  let leadsUpdated = 0;
  let syncError: string | null = null;

  try {
    // Test connection first
    const connection = await testConnection();
    if (!connection.success) {
      return NextResponse.json(
        { error: `Cannot connect to Follow Up Boss: ${connection.message}` },
        { status: 400 }
      );
    }

    // Fetch people in pages
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchAllPeople(limit, offset);
      const people = response.people ?? [];
      leadsFound += people.length;

      for (const person of people) {
        const mapped = mapFubPersonToLead(person);

        // Check for existing lead by FUB ID, email, or phone
        const existing = await db.lead.findFirst({
          where: {
            OR: [
              { followUpBossId: String(person.id) },
              ...(mapped.email ? [{ email: mapped.email }] : []),
            ],
          },
        });

        if (existing) {
          // Update existing lead with fresh FUB data
          await db.lead.update({
            where: { id: existing.id },
            data: {
              name: mapped.name,
              source: mapped.source,
              email: mapped.email,
              phone: mapped.phone ?? existing.phone,
              assignedAgent: mapped.assignedAgent,
              rawFubData: mapped.rawFubData as Parameters<
                typeof db.lead.update
              >[0]["data"]["rawFubData"],
              followUpBossId: mapped.followUpBossId,
            },
          });

          await db.activity.create({
            data: {
              leadId: existing.id,
              type: "sync",
              title: "Lead synced from Follow Up Boss",
              metadata: {
                fubId: person.id,
                syncedAt: new Date().toISOString(),
              },
            },
          });

          leadsUpdated++;
        } else {
          // Create new lead
          const newLead = await db.lead.create({
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

          await db.activity.create({
            data: {
              leadId: newLead.id,
              type: "sync",
              title: "Lead imported from Follow Up Boss",
              metadata: {
                fubId: person.id,
                source: mapped.source,
                importedAt: new Date().toISOString(),
              },
            },
          });

          leadsAdded++;
        }
      }

      // Paginate
      if (
        people.length < limit ||
        (response._metadata?.total &&
          offset + people.length >= response._metadata.total)
      ) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }
  } catch (err) {
    syncError = err instanceof Error ? err.message : String(err);
    console.error("[FUB Sync]", syncError);
  }

  // Log the sync
  const syncLog = await db.syncLog.create({
    data: {
      source: "follow_up_boss",
      status: syncError ? "error" : "success",
      leadsFound,
      leadsAdded,
      leadsUpdated,
      error: syncError,
      details: {
        durationMs: Date.now() - startTime,
        triggeredBy: "manual",
      },
    },
  });

  return NextResponse.json({
    success: !syncError,
    leadsFound,
    leadsAdded,
    leadsUpdated,
    error: syncError,
    syncLogId: syncLog.id,
    durationMs: Date.now() - startTime,
  });
}
