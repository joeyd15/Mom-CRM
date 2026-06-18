import type { Lead } from "./maxtech";

export interface ZapierWebhookPayload {
  event: string;
  leadId?: string;
  data: Record<string, unknown>;
}

export interface ZapierLeadWebhookPayload {
  id?: string;
  lead_id?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: Lead["source"];
  stage?: Lead["stage"];
  tags?: string[] | string;
  [key: string]: unknown;
}

export async function sendToZapierWebhook(payload: ZapierWebhookPayload) {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      sent: false,
      mode: "mock",
      payload,
      note: "Set ZAPIER_WEBHOOK_URL in .env.local to send this payload to a Zapier Catch Hook."
    };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Zapier webhook failed with status ${response.status}`);
  }

  return {
    sent: true,
    status: response.status
  };
}

export function receiveLeadWebhookExample() {
  return {
    event: "lead.created",
    source: "Zillow",
    lead: {
      id: "example-lead-id",
      firstName: "Jordan",
      stage: "New Lead"
    },
    note:
      "Example shape for a future inbound webhook handler. In Next.js, create an app/api/webhooks/zapier/route.ts endpoint to receive Zapier lead payloads."
  };
}

export function mapZapierLeadPayloadToLead(payload: ZapierLeadWebhookPayload): Lead {
  const rawTags = payload.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === "string"
      ? rawTags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : ["zapier"];

  return {
    id: payload.id || payload.lead_id || `zapier-${Date.now()}`,
    firstName: payload.firstName || payload.first_name || "Unknown",
    lastName: payload.lastName || payload.last_name,
    email: payload.email,
    phone: payload.phone,
    source: payload.source || "Other",
    stage: payload.stage || "New Lead",
    tags
  };
}
