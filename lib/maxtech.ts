import type { CampaignFormValues, GeneratedCampaign } from "./types";

export type CRMStage =
  | "New Lead"
  | "Prospect"
  | "Active"
  | "Client"
  | "Past Client"
  | "Cold Lead";

export interface Lead {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: "Zillow" | "Referral" | "Website" | "Open House" | "Social Media" | "Other";
  stage: CRMStage;
  tags?: string[];
}

export interface CampaignStep {
  id?: string;
  dayOffset: number;
  channel: "SMS" | "Email" | "Task" | "Call";
  subject?: string;
  body: string;
}

export interface Campaign {
  id?: string;
  name: string;
  description?: string;
  targetStage?: CRMStage;
  steps: CampaignStep[];
}

export interface MaxTechConfigStatus {
  ready: boolean;
  missing: string[];
  mode: "mock" | "ready-for-implementation";
}

const notImplementedMessage = "Not implemented: MAXTech API credentials required";

export function getMaxTechConfigStatus(): MaxTechConfigStatus {
  const requiredConfig: Array<[string, string | undefined]> = [
    ["MAXTECH_API_BASE_URL", process.env.MAXTECH_API_BASE_URL],
    ["MAXTECH_API_KEY", process.env.MAXTECH_API_KEY]
  ];
  const missing = requiredConfig.filter(([, value]) => !value).map(([key]) => key);

  return {
    ready: missing.length === 0,
    missing,
    mode: missing.length === 0 ? "ready-for-implementation" : "mock"
  };
}

export function buildCampaignDraftFromGeneratedCampaign(input: {
  values: CampaignFormValues;
  campaign: GeneratedCampaign;
}): Campaign {
  const { values, campaign } = input;
  const combinedSteps = [
    {
      dayOffset: 0,
      channel: "SMS" as const,
      body: campaign.immediateFollowUpText
    },
    {
      dayOffset: 0,
      channel: "Email" as const,
      subject: campaign.immediateFollowUpEmail.subject,
      body: campaign.immediateFollowUpEmail.body
    },
    ...campaign.suggestedMaxTechCampaignStructure.steps.map((step) => ({
      dayOffset: step.day,
      channel: mapGeneratedChannelToMaxTechChannel(step.channel),
      subject: step.channel === "Email" ? step.title : undefined,
      body: step.message
    }))
  ];

  return {
    name: campaign.suggestedMaxTechCampaignStructure.name || `${values.leadSource} ${values.leadType} Draft`,
    description: [
      `Generated draft campaign for ${values.leadType} lead from ${values.leadSource}.`,
      `Goal: ${values.campaignGoal}.`,
      "Draft-only. Review and personalize before activating in MAXTech/BoldTrail."
    ].join(" "),
    targetStage: campaign.suggestedLeadCategoryStage,
    steps: combinedSteps
  };
}

export async function getLeadById(leadId: string): Promise<Lead> {
  if (process.env.MAXTECH_API_KEY && process.env.MAXTECH_API_BASE_URL) {
    throw new Error(notImplementedMessage);
  }

  return {
    id: leadId,
    firstName: "Sample",
    lastName: "Lead",
    email: "sample.lead@example.com",
    phone: "555-0100",
    source: "Zillow",
    stage: "New Lead",
    tags: ["mock", "draft-only"]
  };
}

export async function createCampaignDraft(campaign: Campaign): Promise<Campaign> {
  if (process.env.MAXTECH_API_KEY && process.env.MAXTECH_API_BASE_URL) {
    throw new Error(notImplementedMessage);
  }

  return {
    ...campaign,
    id: `mock-campaign-${Date.now()}`
  };
}

export async function assignLeadToCampaign(leadId: string, campaignId: string) {
  if (process.env.MAXTECH_API_KEY && process.env.MAXTECH_API_BASE_URL) {
    throw new Error(notImplementedMessage);
  }

  return {
    leadId,
    campaignId,
    assigned: false,
    mode: "mock",
    note: "Draft-only placeholder. No MAXTech/BoldTrail API call was made."
  };
}

export async function updateLeadStage(leadId: string, stage: CRMStage) {
  if (process.env.MAXTECH_API_KEY && process.env.MAXTECH_API_BASE_URL) {
    throw new Error(notImplementedMessage);
  }

  return {
    leadId,
    stage,
    updated: false,
    mode: "mock",
    note: "Placeholder only. Wire this to the MAXTech/BoldTrail lead update endpoint later."
  };
}

export async function createAgentTask(input: {
  leadId: string;
  title: string;
  dueDate?: string;
  notes?: string;
}) {
  if (process.env.MAXTECH_API_KEY && process.env.MAXTECH_API_BASE_URL) {
    throw new Error(notImplementedMessage);
  }

  return {
    ...input,
    id: `mock-task-${Date.now()}`,
    created: false,
    mode: "mock",
    note: "Placeholder only. No task was created in MAXTech/BoldTrail."
  };
}

function mapGeneratedChannelToMaxTechChannel(channel: "SMS" | "Email" | "Task" | "Call" | "Social") {
  if (channel === "Social") {
    return "Task" as const;
  }

  return channel;
}
