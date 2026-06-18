import { describe, expect, it } from "vitest";
import { sampleCampaignFormValues } from "@/lib/constants";
import { scanCampaignCompliance } from "@/lib/compliance";
import { generateMockRealEstateCampaign } from "@/lib/mockCampaign";

describe("scanCampaignCompliance", () => {
  it("does not flag guarantee language for normal mock output", () => {
    const generated = generateMockRealEstateCampaign(sampleCampaignFormValues);
    const issues = scanCampaignCompliance(generated.campaign);

    expect(
      issues.some((issue) => issue.severity === "warning" && issue.message.includes("guarantee"))
    ).toBe(false);
  });

  it("flags guarantee language", () => {
    const generated = generateMockRealEstateCampaign(sampleCampaignFormValues);
    generated.campaign.immediateFollowUpText = "I guarantee your home value will increase!";

    const issues = scanCampaignCompliance(generated.campaign);

    expect(issues.some((issue) => issue.severity === "warning")).toBe(true);
    expect(issues.some((issue) => issue.message.includes("guarantee"))).toBe(true);
  });
});
