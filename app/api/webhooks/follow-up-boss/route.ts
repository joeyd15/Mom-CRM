/**
 * Follow Up Boss Webhook Endpoint
 *
 * Receives real-time events from Follow Up Boss.
 * Set this URL in FUB: Settings > Integrations > Webhooks
 * URL: https://your-domain.com/api/webhooks/follow-up-boss
 *
 * This endpoint is intentionally lenient about incoming payload shape
 * since FUB webhook payloads can vary by event type.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapFubPersonToLead } from "@/lib/followUpBoss";

export async function POST(req: NextRequest) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // Log every incoming webhook (without secrets)
  console.log(
    "[FUB Webhook] Received:",
    JSON.stringify(payload, null, 2).slice(0, 500)
  );

  try {
    const event = payload as {
      type?: string;
      person?: {
        id: number;
        name?: string;
        emails?: { value: string }[];
        phones?: { value: string }[];
        source?: string;
        stage?: string;
      };
      data?: unknown;
    };

    const eventType = event.type ?? "unknown";
    const person = event.person;

    if (person && person.id) {
      const mapped = mapFubPersonToLead(person as Parameters<typeof mapFubPersonToLead>[0]);

      // Upsert the lead
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

        await db.activity.create({
          data: {
            leadId: existing.id,
            type: "webhook",
            title: `FUB webhook: ${eventType}`,
            metadata: JSON.parse(JSON.stringify({ eventType, fubId: person.id })),
          },
        });
      } else {
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
            type: "webhook",
            title: `New lead via FUB webhook: ${eventType}`,
            metadata: { eventType, fubId: person.id },
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[FUB Webhook] Processing error:", err);
    // Return 200 to prevent FUB from retrying on our processing errors
    return NextResponse.json({ received: true, warning: "Processing error logged" });
  }
}

export async function GET(req: NextRequest) {
  // Some webhook systems do a GET verification
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("challenge");
  if (challenge) return new Response(challenge, { status: 200 });
  return NextResponse.json({ status: "Follow Up Boss webhook endpoint active" });
}
