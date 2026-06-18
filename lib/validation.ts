import {
  campaignGoals,
  leadSources,
  leadStages,
  leadTypes,
  tones
} from "./constants";
import type { CampaignFormValues } from "./types";

export interface ValidationResult {
  ok: boolean;
  issues: string[];
  values?: CampaignFormValues;
}

const maxLengths: Partial<Record<keyof CampaignFormValues, number>> = {
  agentName: 80,
  brokerageName: 120,
  cityMarket: 120,
  leadFirstName: 80,
  propertyDetails: 2000,
  marketNotes: 2000,
  additionalNotes: 2000
};

export function validateCampaignFormValues(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return {
      ok: false,
      issues: ["Request body must be a JSON object."]
    };
  }

  const body = input as Record<string, unknown>;
  const issues: string[] = [];

  const values: CampaignFormValues = {
    agentName: readString(body.agentName),
    brokerageName: readString(body.brokerageName),
    cityMarket: readString(body.cityMarket),
    leadFirstName: readString(body.leadFirstName),
    leadType: readEnum(body.leadType, leadTypes, "Buyer"),
    leadSource: readEnum(body.leadSource, leadSources, "Zillow"),
    leadStage: readEnum(body.leadStage, leadStages, "New Lead"),
    campaignGoal: readEnum(body.campaignGoal, campaignGoals, "Book consultation"),
    tone: readEnum(body.tone, tones, "Friendly"),
    propertyDetails: readString(body.propertyDetails),
    marketNotes: readString(body.marketNotes),
    additionalNotes: readString(body.additionalNotes)
  };

  if (!values.agentName) {
    issues.push("Agent name is required.");
  }

  if (!values.cityMarket) {
    issues.push("City/market is required.");
  }

  validateEnum(body.leadType, leadTypes, "Lead type", issues);
  validateEnum(body.leadSource, leadSources, "Lead source", issues);
  validateEnum(body.leadStage, leadStages, "Lead stage", issues);
  validateEnum(body.campaignGoal, campaignGoals, "Campaign goal", issues);
  validateEnum(body.tone, tones, "Tone", issues);

  for (const [key, maxLength] of Object.entries(maxLengths) as Array<[keyof CampaignFormValues, number]>) {
    if (values[key].length > maxLength) {
      issues.push(`${fieldLabel(key)} must be ${maxLength} characters or fewer.`);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    values
  };
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readEnum<T extends string>(value: unknown, allowedValues: readonly T[], fallback: T): T {
  return typeof value === "string" && allowedValues.includes(value as T) ? (value as T) : fallback;
}

function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  label: string,
  issues: string[]
) {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    issues.push(`${label} must be one of: ${allowedValues.join(", ")}.`);
  }
}

function fieldLabel(key: keyof CampaignFormValues) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
