import { NextResponse } from "next/server";
import {
  mapZapierLeadPayloadToLead,
  receiveLeadWebhookExample,
  type ZapierLeadWebhookPayload
} from "@/lib/zapier";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    mode: "example",
    example: receiveLeadWebhookExample()
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ZapierLeadWebhookPayload;
    const lead = mapZapierLeadPayloadToLead(payload);

    return NextResponse.json({
      received: true,
      mode: "mock",
      lead,
      note: "Inbound Zapier webhook received and mapped locally. No CRM mutation was performed."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to process Zapier webhook payload."
      },
      { status: 500 }
    );
  }
}
