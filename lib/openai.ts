import OpenAI from "openai";
import type { CampaignFormValues, GeneratedCampaign, GenerateResponse } from "./types";
import {
  buildCampaignUserPrompt,
  campaignJsonSchema,
  realEstateCampaignSystemPrompt
} from "./prompts";
import { generateMockRealEstateCampaign } from "./mockCampaign";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY as string
  });
}

function extractResponseText(response: unknown): string {
  const outputText = (response as { output_text?: string }).output_text;
  if (typeof outputText === "string" && outputText.trim()) {
    return outputText;
  }

  const output = (response as { output?: Array<unknown> }).output ?? [];
  const textParts: string[] = [];

  for (const item of output) {
    const content = (item as { content?: Array<unknown> }).content ?? [];
    for (const part of content) {
      const text = (part as { text?: string }).text;
      if (typeof text === "string") {
        textParts.push(text);
      }
    }
  }

  return textParts.join("\n").trim();
}

function safeParseCampaign(rawText: string): GeneratedCampaign | null {
  try {
    return JSON.parse(rawText) as GeneratedCampaign;
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    try {
      return JSON.parse(jsonMatch[0]) as GeneratedCampaign;
    } catch {
      return null;
    }
  }
}

export async function generateRealEstateCampaign(
  values: CampaignFormValues
): Promise<GenerateResponse> {
  if (!process.env.OPENAI_API_KEY || process.env.USE_MOCK_OPENAI === "true") {
    return generateMockRealEstateCampaign(values);
  }

  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: realEstateCampaignSystemPrompt
      },
      {
        role: "user",
        content: buildCampaignUserPrompt(values)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "real_estate_campaign",
        schema: campaignJsonSchema,
        strict: false
      }
    }
  } as never);

  const rawText = extractResponseText(response);
  const parsed = safeParseCampaign(rawText);

  if (parsed) {
    return {
      campaign: parsed,
      rawText,
      parsed: true,
      mode: "openai"
    };
  }

  return {
    parsed: false,
    rawText,
    mode: "openai",
    campaign: {
      immediateFollowUpText: "",
      immediateFollowUpEmail: {
        subject: "Raw AI output needs review",
        body: rawText
      },
      sevenDayFollowUpSequence: [],
      thirtyDayNurtureSequence: [],
      monthlyNewsletter: {
        subject: "Raw AI output needs review",
        body: rawText
      },
      facebookPosts: [],
      instagramPosts: [],
      marketUpdateEmail: {
        subject: "Raw AI output needs review",
        body: rawText
      },
      openHousePromotion: {
        subject: "Raw AI output needs review",
        body: rawText
      },
      suggestedMaxTechCampaignStructure: {
        name: "Raw AI output",
        audience: "Review manually",
        trigger: "Review manually",
        steps: [],
        notes: "The model response could not be parsed as JSON. Use the raw text fallback."
      },
      suggestedLeadCategoryStage: values.leadStage,
      suggestedNextTaskForAgent: "Review the raw AI output and revise before copying into MAXTech/BoldTrail.",
      reviewReminder: "Draft only. Review for accuracy, compliance, tone, and consent before sending.",
      rawTextFallback: rawText
    }
  };
}
