import { describe, expect, it } from "vitest";
import { sampleCampaignFormValues } from "@/lib/constants";
import { buildCampaignDraftFromGeneratedCampaign } from "@/lib/maxtech";
import { generateMockRealEstateCampaign } from "@/lib/mockCampaign";

describe("buildCampaignDraftFromGeneratedCampaign", () => {
  it("maps a generated campaign into the local MAXTech campaign shape", () => {
    const generated = generateMockRealEstateCampaign(sampleCampaignFormValues);
    const draft = buildCampaignDraftFromGeneratedCampaign({
      values: sampleCampaignFormValues,
      campaign: generated.campaign
    });

    expect(draft.name).toContain("Zillow");
    expect(draft.targetStage).toBe(generated.campaign.suggestedLeadCategoryStage);
    expect(draft.steps.length).toBeGreaterThan(generated.campaign.sevenDayFollowUpSequence.length);
    expect(draft.steps.every((step) => ["SMS", "Email", "Task", "Call"].includes(step.channel))).toBe(true);
  });
});
