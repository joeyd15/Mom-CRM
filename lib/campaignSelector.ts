import type { CampaignFormValues } from "./types";

export interface CampaignSelectionSuggestion {
  templateName: string;
  recommendedStage: CampaignFormValues["leadStage"];
  priority: "High" | "Medium" | "Low";
  confidence: number;
  reasons: string[];
  suggestedTags: string[];
  nextAutomationStep: string;
}

export function suggestCampaignSelection(values: CampaignFormValues): CampaignSelectionSuggestion {
  const reasons: string[] = [];
  const suggestedTags = [
    tag(values.leadSource),
    tag(values.leadType),
    tag(values.campaignGoal),
    tag(values.cityMarket || "unknown-market")
  ];

  let templateName = "General Long-Term Nurture";
  let recommendedStage = values.leadStage;
  let priority: CampaignSelectionSuggestion["priority"] = "Medium";
  let confidence = 0.68;

  if (values.leadStage === "New Lead" && values.leadSource === "Zillow") {
    templateName = "Zillow New Lead Speed-To-Contact";
    recommendedStage = "Prospect";
    priority = "High";
    confidence = 0.88;
    reasons.push("Zillow leads usually need a fast, personal first response.");
  }

  if (values.leadType === "Seller" || values.campaignGoal === "Home valuation") {
    templateName = "Seller Valuation Consultation";
    recommendedStage = values.leadStage === "Cold Lead" ? "Prospect" : values.leadStage;
    priority = values.leadStage === "New Lead" ? "High" : "Medium";
    confidence = Math.max(confidence, 0.82);
    reasons.push("Seller and valuation goals should lead with local pricing context and a consultation offer.");
  }

  if (values.leadType === "Past Client" || values.leadStage === "Past Client") {
    templateName = values.campaignGoal === "Re-engage" ? "Past Client Re-Engagement" : "Past Client Monthly Nurture";
    recommendedStage = "Past Client";
    priority = values.campaignGoal === "Re-engage" ? "High" : "Low";
    confidence = Math.max(confidence, 0.8);
    reasons.push("Past clients usually need relationship-first content rather than aggressive conversion copy.");
  }

  if (values.leadType === "Open House Lead" || values.leadSource === "Open House") {
    templateName = "Open House Visitor Follow-Up";
    recommendedStage = "Prospect";
    priority = "High";
    confidence = Math.max(confidence, 0.84);
    reasons.push("Open house leads benefit from quick recap, property feedback, and next-showing prompts.");
  }

  if (values.leadStage === "Cold Lead" || values.campaignGoal === "Re-engage") {
    priority = values.leadType === "Past Client" ? priority : "Medium";
    confidence = Math.max(confidence, 0.74);
    reasons.push("Cold or re-engagement leads should use lower-pressure check-ins and value-driven updates.");
  }

  if (reasons.length === 0) {
    reasons.push("No special-case rule matched, so a general nurture campaign is the safest starting point.");
  }

  return {
    templateName,
    recommendedStage,
    priority,
    confidence,
    reasons,
    suggestedTags: Array.from(new Set(suggestedTags)),
    nextAutomationStep:
      "Keep this as a recommendation only until CRM permissions, consent fields, and campaign template IDs are confirmed."
  };
}

function tag(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
