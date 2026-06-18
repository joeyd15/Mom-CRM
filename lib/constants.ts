import type {
  CampaignFormValues,
  CampaignGoal,
  LeadSource,
  LeadStage,
  LeadType,
  Tone
} from "./types";

export const leadTypes = [
  "Buyer",
  "Seller",
  "Investor",
  "First-Time Buyer",
  "Past Client",
  "Open House Lead"
] as const satisfies readonly LeadType[];

export const leadSources = [
  "Zillow",
  "Referral",
  "Website",
  "Open House",
  "Social Media",
  "Other"
] as const satisfies readonly LeadSource[];

export const leadStages = [
  "New Lead",
  "Prospect",
  "Active",
  "Client",
  "Past Client",
  "Cold Lead"
] as const satisfies readonly LeadStage[];

export const campaignGoals = [
  "Book consultation",
  "Schedule showing",
  "Home valuation",
  "Listing appointment",
  "Long-term nurture",
  "Re-engage"
] as const satisfies readonly CampaignGoal[];

export const tones = ["Professional", "Friendly", "Luxury", "Casual"] as const satisfies readonly Tone[];

export const initialCampaignFormValues: CampaignFormValues = {
  agentName: "",
  brokerageName: "",
  cityMarket: "",
  leadFirstName: "",
  leadType: "Buyer",
  leadSource: "Zillow",
  leadStage: "New Lead",
  campaignGoal: "Book consultation",
  tone: "Friendly",
  propertyDetails: "",
  marketNotes: "",
  additionalNotes: ""
};

export const sampleCampaignFormValues: CampaignFormValues = {
  agentName: "Mia Rodriguez",
  brokerageName: "Harbor & Main Realty",
  cityMarket: "Charleston, SC",
  leadFirstName: "Taylor",
  leadType: "First-Time Buyer",
  leadSource: "Zillow",
  leadStage: "New Lead",
  campaignGoal: "Book consultation",
  tone: "Friendly",
  propertyDetails:
    "Interested in 3 bed / 2 bath homes near walkable restaurants, under $650k. Asked about a listing in West Ashley.",
  marketNotes:
    "Inventory is improving slightly, but well-priced homes are still moving quickly. Buyers are watching monthly payment comfort closely.",
  additionalNotes:
    "Keep the first touch low-pressure. Offer a quick buyer consult and a shortlist of homes that fit their budget."
};
