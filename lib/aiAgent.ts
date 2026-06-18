/**
 * AI Lead Agent
 *
 * Backend worker that processes leads using OpenAI.
 * Runs from API routes and cron jobs — never from the browser.
 * Respects SEND_MODE settings and always logs every action.
 */

import OpenAI from "openai";
import { db } from "./db";
import { env } from "./env";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return openaiClient;
}

export interface AgentAction {
  type:
    | "summarize"
    | "classify"
    | "generate_message"
    | "assign_campaign"
    | "flag_human"
    | "detect_stale"
    | "detect_hot";
  leadId: string;
  result: unknown;
  error?: string;
}

/**
 * Summarize a lead and generate a recommended next step.
 * Updates the lead record in the database.
 */
export async function summarizeLead(leadId: string): Promise<AgentAction> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });

  if (!lead) {
    return {
      type: "summarize",
      leadId,
      result: null,
      error: "Lead not found",
    };
  }

  const prompt = buildSummarizePrompt(lead);

  try {
    const response = await getOpenAI().chat.completions.create({
      model: env.openaiModel,
      messages: [
        {
          role: "system",
          content:
            "You are a real estate lead intelligence assistant. Analyze leads and provide concise, actionable insights for a real estate agent. Always be specific and practical.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      summary: string;
      nextStep: string;
      urgency: string;
      priority: string;
    };

    await db.lead.update({
      where: { id: leadId },
      data: {
        aiSummary: parsed.summary,
        aiRecommendedNextStep: parsed.nextStep,
        priority: parsed.priority ?? lead.priority,
      },
    });

    await logActivity(leadId, "ai_action", "AI Lead Summary Generated", {
      summary: parsed.summary,
      nextStep: parsed.nextStep,
      urgency: parsed.urgency,
    });

    return { type: "summarize", leadId, result: parsed };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await logActivity(leadId, "error", "AI Summary Failed", { error });
    return { type: "summarize", leadId, result: null, error };
  }
}

/**
 * Generate a first-response message (text or email) for a lead.
 * Respects SEND_MODE — never sends unless allowed.
 */
export async function generateFirstResponse(
  leadId: string,
  channel: "sms" | "email"
): Promise<AgentAction> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });

  if (!lead) {
    return {
      type: "generate_message",
      leadId,
      result: null,
      error: "Lead not found",
    };
  }

  if (lead.optedOut || lead.doNotContact) {
    return {
      type: "generate_message",
      leadId,
      result: null,
      error: "Lead has opted out or is marked Do Not Contact",
    };
  }

  const agentName = env.adminEmail.split("@")[0] || "Your Agent";

  const prompt =
    channel === "sms"
      ? buildSmsPrompt(lead, agentName)
      : buildEmailPrompt(lead, agentName);

  try {
    const response = await getOpenAI().chat.completions.create({
      model: env.openaiModel,
      messages: [
        {
          role: "system",
          content:
            "You are a real estate agent assistant. Write concise, warm, professional messages for a real estate agent. Follow all fair housing guidelines. Never make guarantees about property values or returns.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      subject?: string;
      body: string;
    };

    const sendMode = env.sendMode;
    let messageStatus = "pending";

    if (sendMode === "disabled") {
      messageStatus = "pending";
    } else if (sendMode === "manual_approval") {
      messageStatus = "pending";
    } else if (sendMode === "auto_send") {
      messageStatus = "approved";
    }

    const message = await db.message.create({
      data: {
        leadId,
        channel,
        direction: "outbound",
        status: messageStatus,
        subject: parsed.subject,
        body: parsed.body,
        metadata: { generatedBy: "ai_agent", sendMode },
      },
    });

    await logActivity(leadId, "ai_action", `AI ${channel.toUpperCase()} Draft Created`, {
      messageId: message.id,
      status: messageStatus,
      sendMode,
    });

    return {
      type: "generate_message",
      leadId,
      result: { messageId: message.id, status: messageStatus, ...parsed },
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await logActivity(leadId, "error", `AI Message Generation Failed (${channel})`, {
      error,
    });
    return { type: "generate_message", leadId, result: null, error };
  }
}

/**
 * Auto-assign a lead to the best matching campaign.
 */
export async function assignToCampaign(leadId: string): Promise<AgentAction> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return {
      type: "assign_campaign",
      leadId,
      result: null,
      error: "Lead not found",
    };
  }

  // Find active campaigns that match this lead's source or status
  const campaigns = await db.campaign.findMany({
    where: { isActive: true },
    include: { steps: { where: { isActive: true } } },
  });

  let bestCampaign = null;

  // Priority: exact source match > status match > generic
  for (const campaign of campaigns) {
    if (
      campaign.leadSource &&
      lead.source.toLowerCase().includes(campaign.leadSource.toLowerCase())
    ) {
      bestCampaign = campaign;
      break;
    }
    if (campaign.triggerStatus === lead.status) {
      bestCampaign = campaign;
    }
  }

  if (!bestCampaign) {
    return {
      type: "assign_campaign",
      leadId,
      result: null,
      error: "No matching active campaign found",
    };
  }

  await db.lead.update({
    where: { id: leadId },
    data: { campaignId: bestCampaign.id, campaignStage: 0 },
  });

  await logActivity(
    leadId,
    "campaign",
    `Assigned to campaign: ${bestCampaign.name}`,
    { campaignId: bestCampaign.id }
  );

  return {
    type: "assign_campaign",
    leadId,
    result: { campaignId: bestCampaign.id, campaignName: bestCampaign.name },
  };
}

/**
 * Process all new leads through the AI agent pipeline.
 * Called by the cron job.
 */
export async function processNewLeads(): Promise<{
  processed: number;
  errors: number;
  details: AgentAction[];
}> {
  const settings = await db.settings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings?.agentEnabled) {
    return { processed: 0, errors: 0, details: [] };
  }

  const newLeads = await db.lead.findMany({
    where: {
      status: "New Lead",
      aiSummary: null,
      doNotContact: false,
      optedOut: false,
    },
    take: 20,
    orderBy: { createdAt: "asc" },
  });

  const actions: AgentAction[] = [];
  let errors = 0;

  for (const lead of newLeads) {
    // 1. Summarize
    if (settings.autoClassify) {
      const summaryAction = await summarizeLead(lead.id);
      actions.push(summaryAction);
      if (summaryAction.error) errors++;
    }

    // 2. Assign campaign
    if (settings.autoCampaign && !lead.campaignId) {
      const campaignAction = await assignToCampaign(lead.id);
      actions.push(campaignAction);
    }

    // 3. Generate first-response messages (queued, not sent)
    if (settings.messageGen) {
      const smsAction = await generateFirstResponse(lead.id, "sms");
      actions.push(smsAction);
    }
  }

  return {
    processed: newLeads.length,
    errors,
    details: actions,
  };
}

/**
 * Detect and flag stale leads (no contact in X days).
 */
export async function detectStaleLeads(staleDays = 7): Promise<string[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - staleDays);

  const staleLeads = await db.lead.findMany({
    where: {
      status: { in: ["New Lead", "Contacted", "Prospect"] },
      lastContactedAt: { lt: cutoff },
      doNotContact: false,
    },
    select: { id: true, name: true },
  });

  for (const lead of staleLeads) {
    await logActivity(
      lead.id,
      "ai_action",
      `Stale lead flagged — no contact in ${staleDays}+ days`,
      { staleDays }
    );
  }

  return staleLeads.map((l) => l.id);
}

// ─── Prompt Builders ───────────────────────────────────────────────────────────

function buildSummarizePrompt(lead: {
  name: string;
  source: string;
  email: string | null;
  phone: string | null;
  propertyAddress: string | null;
  inquiryMessage: string | null;
  status: string;
  priority: string;
  createdAt: Date;
}): string {
  return `
Analyze this real estate lead and provide a JSON response:

Lead Details:
- Name: ${lead.name}
- Source: ${lead.source}
- Email: ${lead.email ?? "Not provided"}
- Phone: ${lead.phone ?? "Not provided"}
- Property of Interest: ${lead.propertyAddress ?? "Not specified"}
- Inquiry Message: ${lead.inquiryMessage ?? "No message"}
- Current Status: ${lead.status}
- Lead Age: ${Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days old

Respond with JSON:
{
  "summary": "2-3 sentence summary of this lead and their situation",
  "nextStep": "The single most important next action for the agent to take right now",
  "urgency": "High | Medium | Low",
  "priority": "Hot | High | Normal | Low | Cold",
  "leadType": "Buyer | Seller | Investor | Renter | Unknown"
}
`;
}

function buildSmsPrompt(
  lead: {
    name: string;
    source: string;
    propertyAddress: string | null;
    inquiryMessage: string | null;
  },
  agentName: string
): string {
  const firstName = lead.name.split(" ")[0];
  return `
Write a warm, professional first-contact SMS for a real estate agent.

Agent Name: ${agentName}
Lead Name: ${firstName}
Lead Source: ${lead.source}
Property Interest: ${lead.propertyAddress ?? "not specified"}
Their Inquiry: ${lead.inquiryMessage ?? "general inquiry"}

Requirements:
- Under 160 characters ideally (max 320)
- Warm and conversational
- Include agent's name
- End with a clear question or call-to-action
- Follow fair housing guidelines
- Do NOT make guarantees about prices or market timing

Respond with JSON: { "body": "the SMS text" }
`;
}

function buildEmailPrompt(
  lead: {
    name: string;
    source: string;
    propertyAddress: string | null;
    inquiryMessage: string | null;
  },
  agentName: string
): string {
  return `
Write a warm, professional first-contact email for a real estate agent.

Agent Name: ${agentName}
Lead Name: ${lead.name}
Lead Source: ${lead.source}
Property Interest: ${lead.propertyAddress ?? "not specified"}
Their Inquiry: ${lead.inquiryMessage ?? "general inquiry"}

Requirements:
- Professional but warm tone
- Clear subject line
- 3-4 short paragraphs
- Clear call-to-action
- Follow fair housing guidelines
- Do NOT make guarantees about prices or market timing

Respond with JSON: { "subject": "email subject", "body": "email body text" }
`;
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

async function logActivity(
  leadId: string,
  type: string,
  title: string,
  metadata?: Record<string, unknown>
) {
  try {
    await db.activity.create({
      data: {
        leadId,
        type,
        title,
        metadata: metadata as
          | Parameters<typeof db.activity.create>[0]["data"]["metadata"]
          | undefined,
      },
    });
  } catch {
    console.error(`[AI Agent] Failed to log activity for lead ${leadId}`);
  }
}
