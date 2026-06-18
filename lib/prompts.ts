import type { CampaignFormValues } from "./types";

export const realEstateCampaignSystemPrompt = `
You are Real Estate AI Campaign Assistant, a draft-only marketing assistant for a licensed real estate agent using MAXTech/BoldTrail.

Your job:
- Generate realistic, human-sounding real estate campaign drafts.
- Prepare content the agent can review, copy, and paste into MAXTech/BoldTrail.
- Recommend campaign structure and next actions, but never send or schedule messages.

Safety and compliance rules:
- Draft-only mode. Make it clear content must be reviewed before sending.
- Avoid spammy language, pressure tactics, misleading urgency, and excessive punctuation.
- Never guarantee home value increases, appreciation, interest rates, investment returns, inventory outcomes, days on market, or buyer/seller results.
- Do not imply legal, tax, lending, or investment advice.
- Keep SMS messages short, conversational, and consent-aware.
- Emails should sound like a real local agent wrote them.
- Respect fair housing principles. Do not steer buyers or make demographic assumptions.
- Use the lead's first name only when provided.
- Keep claims grounded in the provided market notes. If notes are thin, stay general.
- Return JSON only. Do not wrap it in markdown.
`.trim();

export const campaignJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "immediateFollowUpText",
    "immediateFollowUpEmail",
    "sevenDayFollowUpSequence",
    "thirtyDayNurtureSequence",
    "monthlyNewsletter",
    "facebookPosts",
    "instagramPosts",
    "marketUpdateEmail",
    "openHousePromotion",
    "suggestedMaxTechCampaignStructure",
    "suggestedLeadCategoryStage",
    "suggestedNextTaskForAgent",
    "reviewReminder"
  ],
  properties: {
    immediateFollowUpText: { type: "string" },
    immediateFollowUpEmail: {
      type: "object",
      additionalProperties: false,
      required: ["subject", "body"],
      properties: {
        subject: { type: "string" },
        body: { type: "string" }
      }
    },
    sevenDayFollowUpSequence: { $ref: "#/$defs/sequence" },
    thirtyDayNurtureSequence: { $ref: "#/$defs/sequence" },
    monthlyNewsletter: { $ref: "#/$defs/email" },
    facebookPosts: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: { $ref: "#/$defs/socialPostFacebook" }
    },
    instagramPosts: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: { $ref: "#/$defs/socialPostInstagram" }
    },
    marketUpdateEmail: { $ref: "#/$defs/email" },
    openHousePromotion: { $ref: "#/$defs/email" },
    suggestedMaxTechCampaignStructure: {
      type: "object",
      additionalProperties: false,
      required: ["name", "audience", "trigger", "steps", "notes"],
      properties: {
        name: { type: "string" },
        audience: { type: "string" },
        trigger: { type: "string" },
        steps: { $ref: "#/$defs/sequence" },
        notes: { type: "string" }
      }
    },
    suggestedLeadCategoryStage: {
      type: "string",
      enum: ["New Lead", "Prospect", "Active", "Client", "Past Client", "Cold Lead"]
    },
    suggestedNextTaskForAgent: { type: "string" },
    reviewReminder: { type: "string" }
  },
  $defs: {
    email: {
      type: "object",
      additionalProperties: false,
      required: ["subject", "body"],
      properties: {
        subject: { type: "string" },
        body: { type: "string" }
      }
    },
    sequenceStep: {
      type: "object",
      additionalProperties: false,
      required: ["day", "channel", "title", "message"],
      properties: {
        day: { type: "number" },
        channel: {
          type: "string",
          enum: ["SMS", "Email", "Task", "Call", "Social"]
        },
        title: { type: "string" },
        message: { type: "string" }
      }
    },
    sequence: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/$defs/sequenceStep" }
    },
    socialPostFacebook: {
      type: "object",
      additionalProperties: false,
      required: ["platform", "caption"],
      properties: {
        platform: { type: "string", enum: ["Facebook"] },
        caption: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } }
      }
    },
    socialPostInstagram: {
      type: "object",
      additionalProperties: false,
      required: ["platform", "caption"],
      properties: {
        platform: { type: "string", enum: ["Instagram"] },
        caption: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } }
      }
    }
  }
} as const;

export function buildCampaignUserPrompt(values: CampaignFormValues) {
  return `
Create a complete real estate marketing campaign package using these inputs.

Agent name: ${values.agentName || "Not provided"}
Brokerage/team name: ${values.brokerageName || "Not provided"}
City/market: ${values.cityMarket || "Not provided"}
Lead first name: ${values.leadFirstName || "Not provided"}
Lead type: ${values.leadType}
Lead source: ${values.leadSource}
Lead stage: ${values.leadStage}
Campaign goal: ${values.campaignGoal}
Tone: ${values.tone}
Property details: ${values.propertyDetails || "Not provided"}
Market notes: ${values.marketNotes || "Not provided"}
Additional notes: ${values.additionalNotes || "Not provided"}

Return:
1. Immediate follow-up text
2. Immediate follow-up email with subject line
3. 7-day follow-up sequence
4. 30-day nurture sequence
5. Monthly newsletter
6. 10 Facebook posts
7. 10 Instagram posts
8. Market update email
9. Open house promotion
10. Suggested MAXTech/BoldTrail campaign structure
11. Suggested lead category/stage
12. Suggested next task for agent

Make the MAXTech/BoldTrail structure practical for manual campaign setup or duplication.
`.trim();
}
