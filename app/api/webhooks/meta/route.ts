/**
 * Meta / Facebook / Instagram Webhook Endpoint
 *
 * Handles Facebook Lead Form submissions and other Meta events.
 * Verify token must match META_WEBHOOK_VERIFY_TOKEN in your env.
 *
 * Set this URL in Meta Developer Console:
 * https://your-domain.com/api/webhooks/meta
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMetaWebhook, parseMetaLeadEntry, type MetaLeadFormEntry } from "@/lib/meta";

// GET: Webhook verification handshake
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode") ?? "";
  const token = searchParams.get("hub.verify_token") ?? "";
  const challenge = searchParams.get("hub.challenge") ?? "";

  const response = verifyMetaWebhook(mode, token, challenge);

  if (response !== null) {
    return new Response(response, { status: 200 });
  }

  console.warn("[Meta Webhook] Verification failed — token mismatch");
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// POST: Receive lead form submissions and other events
export async function POST(req: NextRequest) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[Meta Webhook] Received:", JSON.stringify(payload).slice(0, 500));

  try {
    const event = payload as {
      object?: string;
      entry?: {
        id?: string;
        changes?: {
          field?: string;
          value?: {
            leadgen_id?: string;
            page_id?: string;
            form_id?: string;
            ad_id?: string;
            created_time?: number;
            field_data?: { name: string; values: string[] }[];
          };
        }[];
      }[];
    };

    if (event.object === "page" && event.entry) {
      for (const entry of event.entry) {
        for (const change of entry.changes ?? []) {
          if (change.field === "leadgen" && change.value) {
            const leadEntry: MetaLeadFormEntry = {
              id: change.value.leadgen_id ?? "",
              created_time: new Date(
                (change.value.created_time ?? 0) * 1000
              ).toISOString(),
              field_data: change.value.field_data ?? [],
              ad_id: change.value.ad_id,
              form_id: change.value.form_id,
              page_id: change.value.page_id ?? entry.id,
            };

            const parsed = parseMetaLeadEntry(leadEntry);

            // Avoid duplicate leads
            const existing = await db.lead.findFirst({
              where: {
                OR: [
                  ...(parsed.email ? [{ email: parsed.email }] : []),
                  ...(parsed.phone ? [{ phone: parsed.phone }] : []),
                ],
              },
            });

            if (!existing) {
              const newLead = await db.lead.create({
                data: {
                  name: parsed.name,
                  email: parsed.email,
                  phone: parsed.phone,
                  source: "Facebook Lead Form",
                  status: "New Lead",
                  rawFubData: parsed.rawData as Parameters<
                    typeof db.lead.create
                  >[0]["data"]["rawFubData"],
                },
              });

              await db.activity.create({
                data: {
                  leadId: newLead.id,
                  type: "webhook",
                  title: "New lead from Facebook Lead Form",
                  metadata: {
                    adId: change.value.ad_id,
                    formId: change.value.form_id,
                    pageId: change.value.page_id,
                  },
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Meta Webhook] Processing error:", err);
    return NextResponse.json({ received: true, warning: "Processing error" });
  }
}
