/**
 * Campaign Engine
 *
 * Processes campaign steps for enrolled leads.
 * Runs from cron jobs — never from the browser.
 * Respects delays, stop conditions, and send mode settings.
 */

import { db } from "./db";

export interface CampaignProcessResult {
  processed: number;
  messagesQueued: number;
  errors: string[];
}

/**
 * Process pending campaign steps for all enrolled leads.
 * Called by the cron job every 15–30 minutes.
 */
export async function processCampaignSteps(): Promise<CampaignProcessResult> {
  const result: CampaignProcessResult = {
    processed: 0,
    messagesQueued: 0,
    errors: [],
  };

  const settings = await db.settings.findUnique({ where: { id: "singleton" } });
  if (!settings?.agentEnabled) {
    return result;
  }

  // Find all leads enrolled in an active campaign
  const enrolledLeads = await db.lead.findMany({
    where: {
      campaignId: { not: null },
      doNotContact: false,
      optedOut: false,
      status: {
        notIn: ["Closed", "Lost", "Do Not Contact"],
      },
    },
    include: {
      campaign: {
        include: {
          steps: {
            where: { isActive: true },
            orderBy: { stepNumber: "asc" },
          },
        },
      },
    },
  });

  for (const lead of enrolledLeads) {
    if (!lead.campaign || !lead.campaign.isActive) continue;

    const steps = lead.campaign.steps;
    const currentStage = lead.campaignStage ?? 0;

    if (currentStage >= steps.length) {
      // Campaign complete for this lead
      continue;
    }

    const step = steps[currentStage];
    if (!step) continue;

    // Check if enough time has passed for the delay
    const stepUnlockTime = lead.updatedAt;
    stepUnlockTime.setHours(
      stepUnlockTime.getHours() + (step.delayHours ?? 0)
    );

    if (new Date() < stepUnlockTime) {
      // Still waiting for delay
      continue;
    }

    // Business hours check
    if (settings.businessHoursOnly) {
      const hour = new Date().getHours();
      if (hour < settings.businessHoursStart || hour >= settings.businessHoursEnd) {
        continue;
      }
    }

    try {
      if (step.channel === "SMS" || step.channel === "Email") {
        // Queue message from campaign template
        await db.message.create({
          data: {
            leadId: lead.id,
            channel: step.channel.toLowerCase(),
            direction: "outbound",
            status: "pending",
            subject: step.subject,
            body: step.body,
            metadata: {
              campaignId: lead.campaignId,
              campaignStep: step.stepNumber,
              source: "campaign_engine",
            },
          },
        });
        result.messagesQueued++;
      }

      if (step.channel === "Task") {
        await db.activity.create({
          data: {
            leadId: lead.id,
            type: "task",
            title: step.subject ?? `Campaign Task — Step ${step.stepNumber}`,
            description: step.body,
            metadata: {
              campaignId: lead.campaignId,
              campaignStep: step.stepNumber,
            },
          },
        });
      }

      // Advance to next step
      await db.lead.update({
        where: { id: lead.id },
        data: { campaignStage: currentStage + 1 },
      });

      result.processed++;
    } catch (err) {
      const error = `Lead ${lead.id}: ${err instanceof Error ? err.message : String(err)}`;
      result.errors.push(error);
      console.error("[CampaignEngine]", error);
    }
  }

  return result;
}

/**
 * Enroll a lead in a specific campaign.
 */
export async function enrollLeadInCampaign(
  leadId: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return { success: false, error: "Campaign not found" };
    if (!campaign.isActive) return { success: false, error: "Campaign is not active" };

    await db.lead.update({
      where: { id: leadId },
      data: { campaignId, campaignStage: 0 },
    });

    await db.activity.create({
      data: {
        leadId,
        type: "campaign",
        title: `Enrolled in campaign: ${campaign.name}`,
        metadata: { campaignId },
      },
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Remove a lead from their current campaign.
 */
export async function unenrollLeadFromCampaign(
  leadId: string
): Promise<void> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead?.campaignId) return;

  await db.lead.update({
    where: { id: leadId },
    data: { campaignId: null, campaignStage: 0 },
  });

  await db.activity.create({
    data: {
      leadId,
      type: "campaign",
      title: "Removed from campaign",
      metadata: { previousCampaignId: lead.campaignId },
    },
  });
}

/**
 * Seed default campaigns for a fresh install.
 */
export async function seedDefaultCampaigns(): Promise<void> {
  const existing = await db.campaign.count();
  if (existing > 0) return;

  const campaigns = [
    {
      name: "New Zillow Lead — Speed to Lead",
      description:
        "Immediate outreach sequence for new Zillow leads. Focuses on speed and qualification.",
      leadSource: "Zillow",
      triggerStatus: "New Lead",
      isActive: true,
      steps: [
        {
          stepNumber: 0,
          channel: "SMS",
          delayHours: 0,
          subject: null,
          body: "Hi {{firstName}}! I'm {{agentName}}, a local real estate expert. I saw your inquiry about {{propertyAddress}}. I'd love to help! When's a good time to chat? 🏠",
        },
        {
          stepNumber: 1,
          channel: "Email",
          delayHours: 1,
          subject: "Your Zillow Inquiry — Let's Connect!",
          body: "Hi {{firstName}},\n\nThank you for your inquiry on Zillow! I'm {{agentName}} and I specialize in this area.\n\nI'd love to learn more about what you're looking for and see if I can help you find the perfect home.\n\nWould you be available for a quick 15-minute call this week?\n\nBest,\n{{agentName}}",
        },
        {
          stepNumber: 2,
          channel: "Task",
          delayHours: 24,
          subject: "Follow-up call — Zillow lead",
          body: "Call {{firstName}} at {{phone}}. They inquired about {{propertyAddress}} on Zillow. Reference the intro text/email you sent.",
        },
        {
          stepNumber: 3,
          channel: "SMS",
          delayHours: 48,
          subject: null,
          body: "Hi {{firstName}}, just following up! I have some great listings that match what you're looking for. Want me to send them over?",
        },
      ],
    },
    {
      name: "Prospect Nurture",
      description: "Long-term nurture for prospects who aren't ready to act yet.",
      triggerStatus: "Prospect",
      isActive: true,
      steps: [
        {
          stepNumber: 0,
          channel: "Email",
          delayHours: 0,
          subject: "Staying in touch — {{agentName}}",
          body: "Hi {{firstName}},\n\nJust wanted to check in and see how your home search is going. The market has been active and I'd love to share some updates with you.\n\nAre you still looking, or has your situation changed?\n\nBest,\n{{agentName}}",
        },
        {
          stepNumber: 1,
          channel: "SMS",
          delayHours: 168,
          subject: null,
          body: "Hi {{firstName}}! Market update: new listings just hit your target area. Would you like to see them?",
        },
      ],
    },
    {
      name: "Cold Lead Revival",
      description: "Re-engage cold leads with a friendly check-in.",
      triggerStatus: "Nurture",
      isActive: true,
      steps: [
        {
          stepNumber: 0,
          channel: "SMS",
          delayHours: 0,
          subject: null,
          body: "Hi {{firstName}}! It's {{agentName}}. I know it's been a while — just wanted to reach out and see if you're still thinking about buying/selling. The market has some interesting opportunities right now!",
        },
        {
          stepNumber: 1,
          channel: "Email",
          delayHours: 72,
          subject: "Are you still looking? — {{agentName}}",
          body: "Hi {{firstName}},\n\nI've been thinking about your real estate goals and wanted to check in. A lot has changed in the market recently.\n\nIf you're still considering buying or selling, I'd love to reconnect and share some insights specific to your situation.\n\nNo pressure at all — just here when you're ready!\n\nBest,\n{{agentName}}",
        },
      ],
    },
  ];

  for (const campaign of campaigns) {
    const { steps, ...campaignData } = campaign;
    await db.campaign.create({
      data: {
        ...campaignData,
        steps: {
          create: steps,
        },
      },
    });
  }

  console.log("[CampaignEngine] Seeded 3 default campaigns.");
}
