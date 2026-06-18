export type LeadType =
  | "Buyer"
  | "Seller"
  | "Investor"
  | "First-Time Buyer"
  | "Past Client"
  | "Open House Lead";

export type LeadSource =
  | "Zillow"
  | "Referral"
  | "Website"
  | "Open House"
  | "Social Media"
  | "Other";

export type LeadStage =
  | "New Lead"
  | "Prospect"
  | "Active"
  | "Client"
  | "Past Client"
  | "Cold Lead";

export type CampaignGoal =
  | "Book consultation"
  | "Schedule showing"
  | "Home valuation"
  | "Listing appointment"
  | "Long-term nurture"
  | "Re-engage";

export type Tone = "Professional" | "Friendly" | "Luxury" | "Casual";

export interface CampaignFormValues {
  agentName: string;
  brokerageName: string;
  cityMarket: string;
  leadFirstName: string;
  leadType: LeadType;
  leadSource: LeadSource;
  leadStage: LeadStage;
  campaignGoal: CampaignGoal;
  tone: Tone;
  propertyDetails: string;
  marketNotes: string;
  additionalNotes: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface SequenceStep {
  day: number;
  channel: "SMS" | "Email" | "Task" | "Call" | "Social";
  title: string;
  message: string;
}

export interface SocialPost {
  platform: "Facebook" | "Instagram";
  caption: string;
  hashtags?: string[];
}

export interface MaxTechCampaignSuggestion {
  name: string;
  audience: string;
  trigger: string;
  steps: SequenceStep[];
  notes: string;
}

export interface GeneratedCampaign {
  immediateFollowUpText: string;
  immediateFollowUpEmail: EmailDraft;
  sevenDayFollowUpSequence: SequenceStep[];
  thirtyDayNurtureSequence: SequenceStep[];
  monthlyNewsletter: EmailDraft;
  facebookPosts: SocialPost[];
  instagramPosts: SocialPost[];
  marketUpdateEmail: EmailDraft;
  openHousePromotion: EmailDraft;
  suggestedMaxTechCampaignStructure: MaxTechCampaignSuggestion;
  suggestedLeadCategoryStage: LeadStage;
  suggestedNextTaskForAgent: string;
  reviewReminder: string;
  rawTextFallback?: string;
}

export interface GenerateResponse {
  campaign: GeneratedCampaign;
  rawText: string;
  parsed: boolean;
  mode: "openai" | "mock";
  notice?: string;
}

export interface SavedCampaignDraft {
  id: string;
  createdAt: string;
  values: CampaignFormValues;
  campaign: GeneratedCampaign;
  parsed: boolean;
  rawText: string;
  mode: GenerateResponse["mode"];
  notice?: string;
}
